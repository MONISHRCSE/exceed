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

const multer = require('multer');
const fs = require('fs');
const { ElevenLabsClient } = require('elevenlabs');
const upload = multer({ dest: 'uploads/' });

// POST /api/lectures/:id/transcribe
router.post('/:id/transcribe', authMiddleware, upload.single('audio'), async (req, res) => {
  let transcriptText = req.body.transcript;

  // If an audio file is uploaded, transcribe it using ElevenLabs
  if (req.file) {
    try {
      const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
      const transcription = await client.speechToText.convert({
        file: fs.createReadStream(req.file.path),
        model_id: "scribe_v2"
      });
      if (transcription.text && transcription.text.trim().length > 0) {
        transcriptText = transcription.text;
      }
    } catch (error) {
      console.error('ElevenLabs STT error:', error);
      return res.status(500).json({ message: 'Transcription failed' });
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
  }

  if (!transcriptText) {
    return res.status(400).json({ message: 'No audio or transcript provided' });
  }

  const lecture = update('lectures', l => l.id === req.params.id && l.teacher_id === req.user.id,
    { transcript: transcriptText, status: 'completed' });
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
  
  res.json(lecture);
});

module.exports = router;
