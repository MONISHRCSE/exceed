const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = findOne('users', u => u.email === email);
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = insert('users', {
      email, password_hash, role, first_name: firstName, last_name: lastName,
      created_at: new Date().toISOString(), last_login: null,
    });

    if (role === 'student') {
      insert('progress', { student_id: user.id, total_xp: 0, level: 1, notes_viewed: 0, quizzes_completed: 0, flashcards_reviewed: 0, average_quiz_score: 0, last_activity_at: new Date().toISOString() });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = findOne('users', u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    user.last_login = new Date().toISOString();
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  const user = findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
});

module.exports = router;
