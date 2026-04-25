const express = require('express');
const { find, findOne, data } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/teacher', authMiddleware, (req, res) => {
  const totalStudents = find('users', u => u.role === 'student').length;
  const totalLectures = find('lectures', l => l.teacher_id === req.user.id).length;
  const results = find('quiz_results', () => true);
  const avgQuizScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const allProgress = find('progress', () => true);
  const totalViews = allProgress.reduce((s, p) => s + (p.notes_viewed || 0), 0);
  const completionRate = allProgress.length > 0 ? Math.round(allProgress.reduce((s, p) => s + (p.quizzes_completed || 0), 0) / allProgress.length * 10) : 0;

  res.json({ totalStudents, totalLectures, avgQuizScore, totalViews, completionRate });
});

router.get('/lecture/:id', authMiddleware, (req, res) => {
  const notes = find('notes', n => n.lecture_id === req.params.id);
  const noteIds = notes.map(n => n.id);
  const quizzes = find('quizzes', q => noteIds.includes(q.notes_id));
  const quizIds = quizzes.map(q => q.id);
  const results = find('quiz_results', r => quizIds.includes(r.quiz_id));
  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  res.json({ views: 0, avgScore, completionRate: 0 });
});

module.exports = router;
