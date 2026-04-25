const express = require('express');
const { find, findOne, insert, update, remove, uuidv4 } = require('../db/memory-store');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/classes/create — Teacher creates a class
router.post('/create', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name is required' });
  const cls = insert('classes', {
    name, teacher_id: req.user.id, join_code: generateCode(),
    created_at: new Date().toISOString(),
  });
  // Add teacher as member
  insert('class_members', {
    class_id: cls.id, user_id: req.user.id, role: 'teacher',
    joined_at: new Date().toISOString(),
  });
  res.status(201).json(cls);
});

// POST /api/classes/join — Student joins a class
router.post('/join', authMiddleware, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Join code is required' });
  const cls = findOne('classes', c => c.join_code === code.toUpperCase());
  if (!cls) return res.status(404).json({ message: 'Invalid class code' });
  const existing = findOne('class_members', m => m.class_id === cls.id && m.user_id === req.user.id);
  if (existing) return res.status(400).json({ message: 'Already a member of this class' });
  insert('class_members', {
    class_id: cls.id, user_id: req.user.id, role: 'student',
    joined_at: new Date().toISOString(),
  });
  res.json({ message: 'Joined successfully', class: cls });
});

// GET /api/classes/my — Get classes for current user
router.get('/my', authMiddleware, (req, res) => {
  const memberships = find('class_members', m => m.user_id === req.user.id);
  const classes = memberships.map(m => {
    const cls = findOne('classes', c => c.id === m.class_id);
    if (!cls) return null;
    const teacher = findOne('users', u => u.id === cls.teacher_id);
    const memberCount = find('class_members', cm => cm.class_id === cls.id && cm.role === 'student').length;
    return { ...cls, role: m.role, joinedAt: m.joined_at, teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown', memberCount };
  }).filter(Boolean);
  res.json(classes);
});

// GET /api/classes/:id — Get class details
router.get('/:id', authMiddleware, (req, res) => {
  const cls = findOne('classes', c => c.id === req.params.id);
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  const isMember = findOne('class_members', m => m.class_id === cls.id && m.user_id === req.user.id);
  if (!isMember) return res.status(403).json({ message: 'Not a member of this class' });
  const teacher = findOne('users', u => u.id === cls.teacher_id);
  const members = find('class_members', m => m.class_id === cls.id);
  const students = members.filter(m => m.role === 'student').map(m => {
    const user = findOne('users', u => u.id === m.user_id);
    return user ? { id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email, joinedAt: m.joined_at } : null;
  }).filter(Boolean);
  res.json({ ...cls, teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : '', students, memberCount: students.length });
});

// POST /api/classes/:id/session — Create a session
router.post('/:id/session', authMiddleware, (req, res) => {
  const { title, description, date } = req.body;
  const cls = findOne('classes', c => c.id === req.params.id && c.teacher_id === req.user.id);
  if (!cls) return res.status(403).json({ message: 'Not authorized' });
  const session = insert('class_sessions', {
    class_id: cls.id, title, description: description || '',
    date: date || new Date().toISOString(), status: 'active',
    created_at: new Date().toISOString(),
  });
  res.status(201).json(session);
});

// GET /api/classes/:id/sessions
router.get('/:id/sessions', authMiddleware, (req, res) => {
  const sessions = find('class_sessions', s => s.class_id === req.params.id);
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sessions);
});

// POST /api/classes/:id/content — Upload content
router.post('/:id/content', authMiddleware, (req, res) => {
  const { sessionId, type, title, contentUrl, body: contentBody } = req.body;
  const cls = findOne('classes', c => c.id === req.params.id && c.teacher_id === req.user.id);
  if (!cls) return res.status(403).json({ message: 'Not authorized' });
  const content = insert('class_content', {
    class_id: cls.id, session_id: sessionId || null,
    type: type || 'notes', title, content_url: contentUrl || '',
    content_body: contentBody || '', created_at: new Date().toISOString(),
  });
  res.status(201).json(content);
});

// GET /api/classes/:id/content
router.get('/:id/content', authMiddleware, (req, res) => {
  const content = find('class_content', c => c.class_id === req.params.id);
  content.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(content);
});

// GET /api/classes/:id/analytics — Teacher analytics
router.get('/:id/analytics', authMiddleware, (req, res) => {
  const cls = findOne('classes', c => c.id === req.params.id && c.teacher_id === req.user.id);
  if (!cls) return res.status(403).json({ message: 'Not authorized' });

  const members = find('class_members', m => m.class_id === cls.id && m.role === 'student');
  const studentIds = members.map(m => m.user_id);

  // Aggregate attempt data per student
  const studentStats = studentIds.map(sid => {
    const user = findOne('users', u => u.id === sid);
    const attempts = find('attempt_logs', a => a.user_id === sid);
    const total = attempts.length;
    const correct = attempts.filter(a => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = attempts.reduce((s, a) => s + (a.time_taken || 0), 0);
    const masteries = find('concept_mastery', m => m.user_id === sid);
    const weakTopics = masteries.filter(m => m.mastery_score < 0.6).map(m => m.concept_id);
    const lastAttempt = attempts.length > 0 ? Math.max(...attempts.map(a => a.timestamp)) : 0;
    return {
      id: sid, name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      accuracy, totalAttempts: total, correct, timeSpent,
      weakTopics, lastActive: lastAttempt ? new Date(lastAttempt).toISOString() : null,
    };
  });

  // Aggregate class-level stats
  const totalAttempts = studentStats.reduce((s, st) => s + st.totalAttempts, 0);
  const totalCorrect = studentStats.reduce((s, st) => s + st.correct, 0);
  const avgAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const activeStudents = studentStats.filter(s => s.totalAttempts > 0).length;

  // Most missed concepts
  const allMasteries = [];
  studentIds.forEach(sid => {
    find('concept_mastery', m => m.user_id === sid).forEach(m => allMasteries.push(m));
  });
  const conceptErrors = {};
  allMasteries.forEach(m => {
    if (!conceptErrors[m.concept_id]) conceptErrors[m.concept_id] = { concept: m.concept_id, mistakes: 0, attempts: 0 };
    conceptErrors[m.concept_id].mistakes += m.mistake_count;
    conceptErrors[m.concept_id].attempts += m.attempts;
  });
  const topMistakes = Object.values(conceptErrors).sort((a, b) => b.mistakes - a.mistakes).slice(0, 10);

  res.json({
    totalStudents: studentIds.length, activeStudents, avgAccuracy,
    totalAttempts, totalCorrect,
    students: studentStats, topMistakes,
  });
});

// GET /api/classes/:id/students — Student breakdown
router.get('/:id/students', authMiddleware, (req, res) => {
  const members = find('class_members', m => m.class_id === req.params.id && m.role === 'student');
  const students = members.map(m => {
    const user = findOne('users', u => u.id === m.user_id);
    const progress = findOne('progress', p => p.student_id === m.user_id);
    return {
      id: m.user_id,
      name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      email: user ? user.email : '',
      joinedAt: m.joined_at,
      xp: progress ? progress.total_xp : 0,
      level: progress ? progress.level : 1,
    };
  });
  res.json(students);
});

// DELETE /api/classes/:id — Delete a class
router.delete('/:id', authMiddleware, (req, res) => {
  const cls = findOne('classes', c => c.id === req.params.id && c.teacher_id === req.user.id);
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  
  // Clean up associated records
  remove('classes', c => c.id === req.params.id);
  remove('class_members', m => m.class_id === req.params.id);
  remove('class_sessions', s => s.class_id === req.params.id);
  remove('class_content', c => c.class_id === req.params.id);
  
  res.json({ message: 'Class deleted successfully' });
});

module.exports = router;
