/**
 * In-memory data store for development.
 * Drop-in replacement for PostgreSQL queries.
 * Switch to real DB by setting USE_POSTGRES=true in .env
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ── In-Memory Tables ──
const data = {
  users: [],
  lectures: [],
  notes: [],
  quizzes: [],
  questions: [],
  quiz_results: [],
  flashcards: [],
  planner_activities: [],
  doubts: [],
  progress: [],
  attempt_logs: [],
  concept_mastery: [],
  study_streaks: [],
};

// ── Seed Data ──
async function seedMemoryStore() {
  const teacherHash = await bcrypt.hash('password123', 10);
  const studentHash = await bcrypt.hash('password123', 10);

  const teacherId = uuidv4();
  const student1Id = uuidv4();
  const student2Id = uuidv4();
  const student3Id = uuidv4();

  data.users.push(
    { id: teacherId, email: 'teacher@exceed.com', password_hash: teacherHash, role: 'teacher', first_name: 'Dr. Sarah', last_name: 'Chen', created_at: new Date().toISOString(), last_login: null },
    { id: student1Id, email: 'student@exceed.com', password_hash: studentHash, role: 'student', first_name: 'Alex', last_name: 'Johnson', created_at: new Date().toISOString(), last_login: null },
    { id: student2Id, email: 'student2@exceed.com', password_hash: studentHash, role: 'student', first_name: 'Maria', last_name: 'Garcia', created_at: new Date().toISOString(), last_login: null },
    { id: student3Id, email: 'student3@exceed.com', password_hash: studentHash, role: 'student', first_name: 'Raj', last_name: 'Patel', created_at: new Date().toISOString(), last_login: null },
  );

  const lecture1Id = uuidv4();
  const lecture2Id = uuidv4();
  data.lectures.push(
    { id: lecture1Id, teacher_id: teacherId, title: 'Introduction to Machine Learning', audio_file_path: null, transcript: 'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. There are three main types: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models. Common algorithms include linear regression, decision trees, and neural networks.', recorded_at: new Date().toISOString(), duration: 2400, status: 'completed' },
    { id: lecture2Id, teacher_id: teacherId, title: 'Data Structures: Trees and Graphs', audio_file_path: null, transcript: 'Trees are hierarchical data structures with a root node and child nodes. Binary trees have at most two children per node. Binary search trees maintain ordering. Graphs consist of vertices and edges, and can be directed or undirected. Common traversal methods include BFS and DFS.', recorded_at: new Date().toISOString(), duration: 1800, status: 'completed' },
  );

  const notes1Id = uuidv4();
  const notes2Id = uuidv4();
  data.notes.push(
    { id: notes1Id, lecture_id: lecture1Id, teacher_id: teacherId, title: 'Introduction to Machine Learning', content: '# Introduction to Machine Learning\n\n## What is Machine Learning?\nMachine learning is a **subset of artificial intelligence** that focuses on building systems that learn from data.\n\n## Types of Machine Learning\n\n### 1. Supervised Learning\n- Uses labeled training data\n- Maps input to output\n- Examples: classification, regression\n\n### 2. Unsupervised Learning\n- Works with unlabeled data\n- Finds hidden patterns\n- Examples: clustering, dimensionality reduction\n\n### 3. Reinforcement Learning\n- Learns through trial and error\n- Agent interacts with environment\n- Uses rewards and penalties\n\n## Key Algorithms\n- **Linear Regression**: For continuous predictions\n- **Decision Trees**: For classification tasks\n- **Neural Networks**: For complex pattern recognition\n\n## Key Concepts\n- Training data vs test data\n- Overfitting and underfitting\n- Feature engineering\n- Model evaluation metrics', language: 'en', is_original: true, parent_notes_id: null, published_at: new Date().toISOString(), version: 1, created_at: new Date().toISOString() },
    { id: notes2Id, lecture_id: lecture2Id, teacher_id: teacherId, title: 'Data Structures: Trees and Graphs', content: '# Data Structures: Trees and Graphs\n\n## Trees\nTrees are **hierarchical data structures** with a root node and child nodes.\n\n### Binary Trees\n- At most two children per node\n- Left child and right child\n\n### Binary Search Tree (BST)\n- Left subtree values < parent\n- Right subtree values > parent\n- O(log n) average search time\n\n## Graphs\nGraphs consist of **vertices** (nodes) and **edges** (connections).\n\n### Types\n- **Directed**: Edges have direction\n- **Undirected**: Edges are bidirectional\n- **Weighted**: Edges have values\n\n### Traversal Methods\n- **BFS** (Breadth-First Search): Level by level\n- **DFS** (Depth-First Search): Deep first, then backtrack', language: 'en', is_original: true, parent_notes_id: null, published_at: new Date().toISOString(), version: 1, created_at: new Date().toISOString() },
  );

  const quiz1Id = uuidv4();
  const quiz2Id = uuidv4();
  data.quizzes.push(
    { id: quiz1Id, notes_id: notes1Id, title: 'Machine Learning Quiz', question_count: 4, created_at: new Date().toISOString() },
    { id: quiz2Id, notes_id: notes2Id, title: 'Trees & Graphs Quiz', question_count: 3, created_at: new Date().toISOString() },
  );

  data.questions.push(
    { id: uuidv4(), quiz_id: quiz1Id, question_text: 'What is machine learning?', options: ['A programming language', 'A subset of AI that learns from data', 'A database system', 'A web framework'], correct_answer: 1, explanation: 'Machine learning is a subset of artificial intelligence focused on learning from data.', difficulty: 'easy' },
    { id: uuidv4(), quiz_id: quiz1Id, question_text: 'Which type of ML uses labeled data?', options: ['Unsupervised', 'Reinforcement', 'Supervised', 'None of these'], correct_answer: 2, explanation: 'Supervised learning uses labeled training data to learn mappings.', difficulty: 'easy' },
    { id: uuidv4(), quiz_id: quiz1Id, question_text: 'What is overfitting?', options: ['Too simple model', 'Model memorizes training data', 'Fast training', 'Low accuracy'], correct_answer: 1, explanation: 'Overfitting occurs when a model learns noise in training data.', difficulty: 'medium' },
    { id: uuidv4(), quiz_id: quiz1Id, question_text: 'Which algorithm is best for complex patterns?', options: ['Linear Regression', 'Decision Trees', 'Neural Networks', 'K-means'], correct_answer: 2, explanation: 'Neural networks excel at recognizing complex patterns.', difficulty: 'medium' },
    { id: uuidv4(), quiz_id: quiz2Id, question_text: 'How many children can a binary tree node have?', options: ['1', 'At most 2', '3', 'Unlimited'], correct_answer: 1, explanation: 'Binary trees have at most 2 children per node.', difficulty: 'easy' },
    { id: uuidv4(), quiz_id: quiz2Id, question_text: 'What does BFS stand for?', options: ['Binary Find Search', 'Breadth-First Search', 'Best-First Sort', 'Backward Full Scan'], correct_answer: 1, explanation: 'BFS = Breadth-First Search, explores level by level.', difficulty: 'easy' },
    { id: uuidv4(), quiz_id: quiz2Id, question_text: 'In a BST, left subtree values are?', options: ['Greater than parent', 'Equal to parent', 'Less than parent', 'Random'], correct_answer: 2, explanation: 'In a BST, left child values are always less than the parent.', difficulty: 'medium' },
  );

  data.flashcards.push(
    { id: uuidv4(), notes_id: notes1Id, front: 'What is supervised learning?', back: 'A type of ML that uses labeled data to train models to map inputs to outputs.', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes1Id, front: 'What is overfitting?', back: 'When a model learns the training data too well, including noise, and performs poorly on new data.', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes1Id, front: 'Name three ML algorithms', back: 'Linear Regression, Decision Trees, Neural Networks', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes1Id, front: 'What is reinforcement learning?', back: 'ML approach where an agent learns through trial and error using rewards and penalties.', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes2Id, front: 'What is a binary search tree?', back: 'A binary tree where left subtree values < parent and right subtree values > parent.', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes2Id, front: 'Difference between BFS and DFS?', back: 'BFS explores level by level (breadth). DFS goes deep first, then backtracks.', reviewed: false, created_at: new Date().toISOString() },
    { id: uuidv4(), notes_id: notes2Id, front: 'What is a directed graph?', back: 'A graph where edges have direction, meaning they go from one vertex to another.', reviewed: false, created_at: new Date().toISOString() },
  );

  const today = new Date().toISOString().split('T')[0];
  for (const sid of [student1Id, student2Id, student3Id]) {
    const xp = Math.floor(Math.random() * 300) + 50;
    data.progress.push({ id: uuidv4(), student_id: sid, total_xp: xp, level: Math.floor(xp / 500) + 1, notes_viewed: Math.floor(Math.random() * 5), quizzes_completed: Math.floor(Math.random() * 3), flashcards_reviewed: Math.floor(Math.random() * 10), average_quiz_score: Math.floor(Math.random() * 40) + 50, last_activity_at: new Date().toISOString() });
    data.planner_activities.push(
      { id: uuidv4(), student_id: sid, type: 'notes', content_id: notes1Id, title: 'Review: Machine Learning', description: '', scheduled_date: today, completed: false, completed_at: null, xp_reward: 15, is_auto_generated: true },
      { id: uuidv4(), student_id: sid, type: 'quiz', content_id: quiz1Id, title: 'Take ML Quiz', description: '', scheduled_date: today, completed: false, completed_at: null, xp_reward: 25, is_auto_generated: true },
    );
  }

  console.log('In-memory store seeded with demo data.');
}

// ── Query helpers ──
function find(table, predicate) {
  return data[table].filter(predicate);
}

function findOne(table, predicate) {
  return data[table].find(predicate) || null;
}

function insert(table, record) {
  if (!record.id) record.id = uuidv4();
  data[table].push(record);
  return record;
}

function update(table, predicate, updates) {
  const item = data[table].find(predicate);
  if (item) Object.assign(item, updates);
  return item;
}

function remove(table, predicate) {
  const idx = data[table].findIndex(predicate);
  if (idx >= 0) return data[table].splice(idx, 1)[0];
  return null;
}

function count(table, predicate) {
  return predicate ? data[table].filter(predicate).length : data[table].length;
}

module.exports = { data, seedMemoryStore, find, findOne, insert, update, remove, count, uuidv4 };
