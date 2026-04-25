const express = require('express');
const { find, findOne, insert, update, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/notes/refine
router.post('/refine', authMiddleware, (req, res) => {
  try {
    const { lectureId, transcript } = req.body;
    const lecture = findOne('lectures', l => l.id === lectureId);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

    const title = lecture.title;
    let rawSentences = (transcript || '').split(/[.!?\n]+/).filter(s => s.trim());
    if (rawSentences.length <= 2 && (transcript || '').length > 60) {
      // Force split long run-on transcripts so we can generate mock key concepts
      rawSentences = (transcript || '').split(/, | and | so | because | then /i).filter(s => s.trim());
    }
    
    let refined = `# ${title}\n\n## Overview\n${rawSentences.slice(0, 2).join('. ').trim()}.\n\n## Key Concepts\n`;
    if (rawSentences.length > 2) {
      rawSentences.slice(2).forEach(s => { refined += `- ${s.trim()}\n`; });
    } else if (rawSentences.length > 0) {
      refined += `- ${rawSentences[0].trim()}\n`;
    } else {
      refined += `- No key concepts identified.\n`;
    }
    
    refined += `\n## Summary\nThis lecture covered the fundamentals of ${title.toLowerCase()}.`;

    const notes = insert('notes', {
      lecture_id: lectureId, teacher_id: req.user.id, title, content: refined,
      language: 'en', is_original: true, parent_notes_id: null, published_at: null,
      version: 1, created_at: new Date().toISOString(),
    });
    res.status(201).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notes/teacher
router.get('/teacher', authMiddleware, (req, res) => {
  const notes = find('notes', n => n.teacher_id === req.user.id && n.is_original);
  notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(notes);
});

// GET /api/notes/student
router.get('/student', authMiddleware, (req, res) => {
  const notes = find('notes', n => n.published_at && n.is_original);
  notes.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  res.json(notes);
});

// GET /api/notes/:id
router.get('/:id', authMiddleware, (req, res) => {
  const language = req.query.language || 'en';
  let notes = findOne('notes', n => n.parent_notes_id === req.params.id && n.language === language);
  if (!notes) notes = findOne('notes', n => n.id === req.params.id);
  if (!notes) return res.status(404).json({ message: 'Notes not found' });
  res.json(notes);
});

// PUT /api/notes/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { content } = req.body;
  const notes = update('notes', n => n.id === req.params.id && n.teacher_id === req.user.id,
    { content, version: (findOne('notes', n => n.id === req.params.id)?.version || 0) + 1 });
  if (!notes) return res.status(404).json({ message: 'Notes not found' });
  res.json(notes);
});

// POST /api/notes/:id/translate
router.post('/:id/translate', authMiddleware, (req, res) => {
  const { languages } = req.body;
  const original = findOne('notes', n => n.id === req.params.id);
  if (!original) return res.status(404).json({ message: 'Notes not found' });

  const translations = [];
  for (const lang of languages) {
    const t = insert('notes', {
      lecture_id: original.lecture_id, teacher_id: req.user.id, title: original.title,
      content: `[Translated to ${lang}]\n\n${original.content}`,
      language: lang, is_original: false, parent_notes_id: original.id,
      published_at: original.published_at, version: 1, created_at: new Date().toISOString(),
    });
    translations.push(t);
  }
  res.json({ translations, count: translations.length });
});

// POST /api/notes/:id/publish
router.post('/:id/publish', authMiddleware, (req, res) => {
  const { class_ids } = req.body || {};
  const notes = update('notes', n => n.id === req.params.id && n.teacher_id === req.user.id,
    { published_at: new Date().toISOString() });
  if (!notes) return res.status(404).json({ message: 'Notes not found' });

  if (Array.isArray(class_ids)) {
    class_ids.forEach(cid => {
      const cls = findOne('classes', c => c.id === cid && c.teacher_id === req.user.id);
      if (cls) {
        // Prevent duplicate sessions for the same note in the same class
        const existingSession = findOne('class_sessions', s => s.class_id === cls.id && s.notes_id === notes.id);
        if (!existingSession) {
          insert('class_sessions', {
            class_id: cls.id,
            notes_id: notes.id,
            lecture_id: notes.lecture_id,
            title: notes.title,
            description: 'Auto-generated from recorded lecture',
            date: new Date().toISOString(),
            status: 'active',
            created_at: new Date().toISOString(),
          });
        }
      }
    });
  }
  
  res.json(notes);
});

// DELETE /api/notes/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const notes = findOne('notes', n => n.id === req.params.id && n.teacher_id === req.user.id);
  if (!notes) return res.status(404).json({ message: 'Notes not found' });

  // Clean up associated translations and class sessions
  const { remove } = require('../db/memory-store');
  remove('notes', n => n.id === req.params.id || n.parent_notes_id === req.params.id);
  remove('class_sessions', s => s.notes_id === req.params.id);
  
  res.json({ message: 'Notes deleted successfully' });
});

module.exports = router;
