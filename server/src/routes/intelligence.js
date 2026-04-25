const express = require('express');
const { find, findOne, insert, update, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── MASTERY CALCULATION ──
function calculateMastery(correct, attempts, lastReviewed) {
  if (attempts === 0) return 0;
  const accuracy = correct / attempts;
  const daysSince = lastReviewed ? (Date.now() - new Date(lastReviewed).getTime()) / 86400000 : 30;
  const recency = Math.max(0, 1 - daysSince / 30); // Decays over 30 days
  return Math.round((accuracy * 0.7 + recency * 0.3) * 100) / 100;
}

function calculatePriority(mastery, mistakeCount, deadlineDays) {
  const weaknessFactor = (1 - mastery) * 0.5;
  const mistakeFactor = Math.min(mistakeCount / 10, 1) * 0.3;
  const deadlineFactor = deadlineDays != null ? Math.max(0, 1 - deadlineDays / 14) * 0.2 : 0;
  return Math.round((weaknessFactor + mistakeFactor + deadlineFactor) * 100) / 100;
}

// POST /api/intelligence/attempt — Log a question attempt
router.post('/attempt', authMiddleware, (req, res) => {
  try {
    const { conceptId, questionId, isCorrect, timeTaken, subject } = req.body;
    const userId = req.user.id;

    // 1. Log the attempt
    const log = insert('attempt_logs', {
      user_id: userId, concept_id: conceptId, question_id: questionId,
      is_correct: isCorrect, time_taken: timeTaken || 0,
      timestamp: Date.now(),
    });

    // 2. Update or create concept mastery
    let mastery = findOne('concept_mastery', m => m.user_id === userId && m.concept_id === conceptId);
    if (!mastery) {
      mastery = insert('concept_mastery', {
        user_id: userId, concept_id: conceptId, subject: subject || 'General',
        attempts: 0, correct: 0, mistake_count: 0,
        mastery_score: 0, last_reviewed: new Date().toISOString(),
      });
    }

    mastery.attempts += 1;
    if (isCorrect) {
      mastery.correct += 1;
    } else {
      mastery.mistake_count += 1;
    }
    mastery.last_reviewed = new Date().toISOString();
    mastery.mastery_score = calculateMastery(mastery.correct, mastery.attempts, mastery.last_reviewed);

    // 3. Update user progress XP
    const progress = findOne('progress', p => p.student_id === userId);
    if (progress) {
      const xp = isCorrect ? 5 : 1;
      progress.total_xp = (progress.total_xp || 0) + xp;
      progress.level = Math.floor(progress.total_xp / 500) + 1;
      progress.last_activity_at = new Date().toISOString();
    }

    // 4. Update streak
    let streak = findOne('study_streaks', s => s.user_id === userId);
    const todayStr = new Date().toISOString().split('T')[0];
    if (!streak) {
      streak = insert('study_streaks', {
        user_id: userId, current_streak: 1, max_streak: 1,
        last_active_date: todayStr, total_days_active: 1,
      });
    } else if (streak.last_active_date !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (streak.last_active_date === yesterdayStr) {
        streak.current_streak += 1;
      } else {
        streak.current_streak = 1;
      }
      streak.max_streak = Math.max(streak.max_streak, streak.current_streak);
      streak.last_active_date = todayStr;
      streak.total_days_active += 1;
    }

    res.json({ logged: log.id, mastery: mastery.mastery_score, streak: streak.current_streak });
  } catch (err) {
    console.error('Attempt log error:', err);
    res.status(500).json({ message: 'Failed to log attempt' });
  }
});

// GET /api/intelligence/mastery — Get all concept mastery for user
router.get('/mastery', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const masteries = find('concept_mastery', m => m.user_id === userId);
  // Recalculate with decay
  masteries.forEach(m => {
    m.mastery_score = calculateMastery(m.correct, m.attempts, m.last_reviewed);
  });
  res.json(masteries);
});

// GET /api/intelligence/weak-topics — Get weak concepts
router.get('/weak-topics', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const masteries = find('concept_mastery', m => m.user_id === userId);
  const weak = masteries
    .map(m => ({
      ...m,
      mastery_score: calculateMastery(m.correct, m.attempts, m.last_reviewed),
      priority: calculatePriority(
        calculateMastery(m.correct, m.attempts, m.last_reviewed),
        m.mistake_count
      ),
    }))
    .filter(m => m.mastery_score < 0.6 || m.mistake_count > 3)
    .sort((a, b) => b.priority - a.priority);
  res.json(weak);
});

// GET /api/intelligence/stats — Aggregated real metrics
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const attempts = find('attempt_logs', a => a.user_id === userId);
  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter(a => a.is_correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const masteries = find('concept_mastery', m => m.user_id === userId);
  const avgMastery = masteries.length > 0
    ? Math.round(masteries.reduce((s, m) => s + calculateMastery(m.correct, m.attempts, m.last_reviewed), 0) / masteries.length * 100)
    : 0;

  const progress = findOne('progress', p => p.student_id === userId);
  const xp = progress ? progress.total_xp || 0 : 0;
  const level = progress ? progress.level || 1 : 1;

  const streak = findOne('study_streaks', s => s.user_id === userId);
  const currentStreak = streak ? streak.current_streak : 0;
  const maxStreak = streak ? streak.max_streak : 0;
  const totalDaysActive = streak ? streak.total_days_active : 0;

  const weakCount = masteries.filter(m =>
    calculateMastery(m.correct, m.attempts, m.last_reviewed) < 0.6 || m.mistake_count > 3
  ).length;

  const conceptsLearned = masteries.filter(m =>
    calculateMastery(m.correct, m.attempts, m.last_reviewed) >= 0.7
  ).length;

  // Recent activity (last 7 days)
  const weekAgo = Date.now() - 7 * 86400000;
  const recentAttempts = attempts.filter(a => a.timestamp > weekAgo);
  const weeklyAccuracy = recentAttempts.length > 0
    ? Math.round((recentAttempts.filter(a => a.is_correct).length / recentAttempts.length) * 100)
    : 0;

  res.json({
    xp, level, accuracy, weeklyAccuracy, avgMastery,
    currentStreak, maxStreak, totalDaysActive,
    totalAttempts, totalCorrect,
    conceptsLearned, weakCount,
    totalConcepts: masteries.length,
  });
});

// GET /api/intelligence/history — Recent attempt history
router.get('/history', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const attempts = find('attempt_logs', a => a.user_id === userId);
  attempts.sort((a, b) => b.timestamp - a.timestamp);
  res.json(attempts.slice(0, limit));
});

module.exports = router;
