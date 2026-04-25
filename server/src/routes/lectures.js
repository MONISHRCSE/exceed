const express = require('express');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/lectures
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title } = req.body;
    const lecture = insert('lectures', {
      teacher_id: req.user.id, title: title || 'Untitled Lecture',
      audio_file_path: null, transcript: '', recorded_at: new Date().toISOString(),
      duration: 0, status: 'completed',
    });
    res.status(201).json(lecture);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lectures
router.get('/', authMiddleware, (req, res) => {
  try {
    let lectures;
    if (req.user.role === 'teacher') {
      lectures = find('lectures', l => l.teacher_id === req.user.id);
    } else {
      lectures = find('lectures', () => true);
    }
    lectures.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
    res.json(lectures);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lectures/:id
router.get('/:id', authMiddleware, (req, res) => {
  const lecture = findOne('lectures', l => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
  res.json(lecture);
});

// POST /api/lectures/:id/transcribe
router.post('/:id/transcribe', authMiddleware, (req, res) => {
  const { transcript } = req.body;
  const lecture = update('lectures', l => l.id === req.params.id && l.teacher_id === req.user.id,
    { transcript, status: 'completed' });
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
  res.json(lecture);
});

module.exports = router;
