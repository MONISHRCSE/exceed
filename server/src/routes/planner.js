const express = require('express');
const { find, findOne, insert, update, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const activities = find('planner_activities', a => a.student_id === req.user.id);
  activities.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  res.json(activities);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, scheduledDate, type, subject, topic, duration, priority } = req.body;
  const activity = insert('planner_activities', {
    student_id: req.user.id, type: type || 'custom', content_id: null,
    title, description: description || '', scheduled_date: scheduledDate,
    subject: subject || '', topic: topic || '', duration: duration || 30,
    priority: priority || 'medium', source: 'manual',
    completed: false, completed_at: null, xp_reward: 10, is_auto_generated: false,
  });
  res.status(201).json(activity);
});

router.put('/:id/complete', authMiddleware, (req, res) => {
  const activity = update('planner_activities',
    a => a.id === req.params.id && a.student_id === req.user.id,
    { completed: true, completed_at: new Date().toISOString() });
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  const xp = activity.xp_reward || 10;
  const progress = findOne('progress', p => p.student_id === req.user.id);
  if (progress) {
    progress.total_xp = (progress.total_xp || 0) + xp;
    progress.last_activity_at = new Date().toISOString();
  }
  res.json({ ...activity, xp_awarded: xp });
});

router.put('/:id/reschedule', authMiddleware, (req, res) => {
  const { newDate } = req.body;
  const activity = update('planner_activities',
    a => a.id === req.params.id && a.student_id === req.user.id,
    { scheduled_date: newDate });
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  res.json(activity);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const { remove } = require('../db/memory-store');
  const removed = remove('planner_activities',
    a => a.id === req.params.id && a.student_id === req.user.id);
  if (!removed) return res.status(404).json({ message: 'Activity not found' });
  res.json({ message: 'Deleted' });
});

// POST /api/planner/generate - AI Smart Plan Generation
router.post('/generate', authMiddleware, (req, res) => {
  const { weakTopics, examDates } = req.body;
  const userId = req.user.id;
  const today = new Date();
  const types = ['revise', 'quiz', 'flashcard', 'practice'];
  const subjects = ['Physics', 'Mathematics', 'Biology', 'Computer Science'];
  const topics = weakTopics && weakTopics.length > 0
    ? weakTopics
    : ['Kinematics', 'Derivatives', 'Cell Biology', 'Data Structures'];

  const generated = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const taskCount = d === 0 ? 3 : Math.floor(Math.random() * 3) + 1;
    for (let t = 0; t < taskCount; t++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const durations = [15, 20, 25, 30, 45];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const priorities = ['low', 'medium', 'high'];
      let priority = priorities[Math.floor(Math.random() * priorities.length)];
      // Boost priority for days near exams
      if (examDates) {
        examDates.forEach(ed => {
          const diff = Math.abs((new Date(ed) - date) / 86400000);
          if (diff <= 3) priority = 'high';
        });
      }
      const task = insert('planner_activities', {
        student_id: userId, type, content_id: null,
        title: `${type === 'revise' ? 'Revise' : type === 'quiz' ? 'Quiz' : type === 'flashcard' ? 'Flashcards' : 'Practice'}: ${topic}`,
        description: '', scheduled_date: dateStr, subject, topic, duration,
        priority, source: 'auto', completed: false, completed_at: null,
        xp_reward: duration >= 30 ? 25 : 15, is_auto_generated: true,
      });
      generated.push(task);
    }
  }
  res.json({ generated: generated.length, tasks: generated });
});

// POST /api/planner/balance - Redistribute overloaded days
router.post('/balance', authMiddleware, (req, res) => {
  const tasks = find('planner_activities', a => a.student_id === req.user.id && !a.completed);
  const byDate = {};
  tasks.forEach(t => {
    if (!byDate[t.scheduled_date]) byDate[t.scheduled_date] = [];
    byDate[t.scheduled_date].push(t);
  });
  const dates = Object.keys(byDate).sort();
  let moved = 0;
  dates.forEach(date => {
    while (byDate[date] && byDate[date].length > 4) {
      const task = byDate[date].pop();
      // Find next date with fewer tasks
      let targetDate = null;
      for (const d of dates) {
        if (d > date && (!byDate[d] || byDate[d].length < 3)) {
          targetDate = d;
          break;
        }
      }
      if (!targetDate) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        targetDate = nextDay.toISOString().split('T')[0];
      }
      task.scheduled_date = targetDate;
      if (!byDate[targetDate]) byDate[targetDate] = [];
      byDate[targetDate].push(task);
      moved++;
    }
  });
  res.json({ moved, message: `Balanced ${moved} tasks across days` });
});

module.exports = router;
