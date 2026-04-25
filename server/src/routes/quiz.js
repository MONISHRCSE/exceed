const express = require('express');
const { find, findOne, insert, update, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/quiz/generate
router.post('/generate', authMiddleware, (req, res) => {
  try {
    const { notesId } = req.body;
    const notes = findOne('notes', n => n.id === notesId);
    if (!notes) return res.status(404).json({ message: 'Notes not found' });

    const content = notes.content || '';
    const lines = content.split('\n').filter(l => l.trim().startsWith('- '));
    const questions = [];

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const concept = lines[i].replace(/^-\s+\*?\*?/, '').replace(/\*?\*?$/, '').trim();
      if (concept.length < 5) continue;
      const qId = uuidv4();
      questions.push({ id: qId, question_text: `What is true about: ${concept.substring(0, 60)}?`, options: ['It is a key concept in this lecture', 'It is unrelated to the topic', 'It contradicts the lecture content', 'None of the above'], correct_answer: 0, explanation: `"${concept}" is discussed as a key concept.`, difficulty: 'medium' });
    }

    if (questions.length === 0) {
      questions.push({ id: uuidv4(), question_text: `What is the main topic of "${notes.title}"?`, options: [notes.title, 'Cooking recipes', 'Sports history', 'Fashion design'], correct_answer: 0, explanation: `The lecture covers ${notes.title}.`, difficulty: 'easy' });
    }

    const quiz = insert('quizzes', { notes_id: notesId, title: `Quiz: ${notes.title}`, question_count: questions.length, created_at: new Date().toISOString() });
    questions.forEach(q => insert('questions', { ...q, quiz_id: quiz.id }));
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quiz/student
router.get('/student', authMiddleware, (req, res) => {
  const publishedNoteIds = find('notes', n => n.published_at).map(n => n.id);
  const quizzes = find('quizzes', q => publishedNoteIds.includes(q.notes_id));
  quizzes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(quizzes);
});

// GET /api/quiz/results
router.get('/results', authMiddleware, (req, res) => {
  const results = find('quiz_results', r => r.student_id === req.user.id);
  results.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  res.json(results);
});

// GET /api/quiz/:id
router.get('/:id', authMiddleware, (req, res) => {
  const quiz = findOne('quizzes', q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  const questions = find('questions', q => q.quiz_id === req.params.id);
  res.json({ ...quiz, questions });
});

// POST /api/quiz/:id/submit
router.post('/:id/submit', authMiddleware, (req, res) => {
  try {
    const { answers } = req.body;
    const questions = find('questions', q => q.quiz_id === req.params.id);

    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_answer) correct++; });
    const score = questions.length > 0 ? Math.round(correct / questions.length * 100) : 0;
    const xpAwarded = Math.round(score / 10) * 5;

    const result = insert('quiz_results', { quiz_id: req.params.id, student_id: req.user.id, answers: JSON.stringify(answers), score, completed_at: new Date().toISOString(), time_spent: 0 });

    const progress = findOne('progress', p => p.student_id === req.user.id);
    if (progress) {
      progress.total_xp = (progress.total_xp || 0) + xpAwarded;
      progress.quizzes_completed = (progress.quizzes_completed || 0) + 1;
      progress.average_quiz_score = Math.round(((progress.average_quiz_score || 0) * (progress.quizzes_completed - 1) + score) / progress.quizzes_completed);
      progress.level = Math.floor(progress.total_xp / 500) + 1;
      progress.last_activity_at = new Date().toISOString();
    }

    res.json({ ...result, xp_awarded: xpAwarded });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
