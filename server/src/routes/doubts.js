const express = require('express');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const { lectureId, questionText, isVoice } = req.body;
  const doubt = insert('doubts', {
    student_id: req.user.id, lecture_id: lectureId, question_text: questionText,
    is_voice: isVoice || false, audio_file_path: null, submitted_at: new Date().toISOString(),
    response: null, responded_at: null, responded_by: null, status: 'pending',
  });
  res.status(201).json(doubt);
});

router.get('/student', authMiddleware, (req, res) => {
  const doubts = find('doubts', d => d.student_id === req.user.id);
  doubts.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  res.json(doubts);
});

router.get('/teacher', authMiddleware, (req, res) => {
  const doubts = find('doubts', () => true);
  const result = doubts.map(d => {
    const student = findOne('users', u => u.id === d.student_id);
    return { ...d, student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown' };
  });
  result.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  res.json(result);
});

router.put('/:id/respond', authMiddleware, (req, res) => {
  const { response } = req.body;
  const doubt = update('doubts', d => d.id === req.params.id,
    { response, responded_at: new Date().toISOString(), responded_by: req.user.id, status: 'answered' });
  if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
  res.json(doubt);
});

module.exports = router;
