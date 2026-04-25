const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { seedMemoryStore } = require('./db/memory-store');

const authRoutes = require('./routes/auth');
const lectureRoutes = require('./routes/lectures');
const notesRoutes = require('./routes/notes');
const quizRoutes = require('./routes/quiz');
const flashcardRoutes = require('./routes/flashcards');
const plannerRoutes = require('./routes/planner');
const doubtRoutes = require('./routes/doubts');
const progressRoutes = require('./routes/progress');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed in-memory store and start server
seedMemoryStore().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Exceed API running on http://localhost:${PORT}`);
    console.log(`   Using in-memory data store (seeded with demo data)`);
    console.log(`\n   Demo accounts:`);
    console.log(`   Teacher: teacher@exceed.com / password123`);
    console.log(`   Student: student@exceed.com / password123\n`);
  });
});
