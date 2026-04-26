const express = require('express');
const { find, findOne, insert, update, remove } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── AI caller (reuse Featherless) ──────────────────────────────────────────
async function callAI(messages, { temperature = 0.4, maxTokens = 4000 } = {}) {
  const key = process.env.FEATHERLESS_API_KEY;
  if (!key) throw new Error('FEATHERLESS_API_KEY not configured');
  const res = await fetch('https://api.featherless.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'Qwen/Qwen2.5-7B-Instruct', messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── POST /api/journeys/generate ──────────────────────────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  const { notesId, content, title } = req.body;
  if (!content) return res.status(400).json({ message: 'Note content is required' });

  const { v4: uuidv4 } = require('uuid');
  const journeyId = uuidv4();

  const systemPrompt = `You are an educational content designer. Convert the provided study notes into a structured learning journey with 5-8 sequential nodes.

Rules:
- Each node must be tightly focused on ONE concept from the notes
- Alternate node types: start with learn, then quiz, then checkpoint, then learn, etc.
- Quiz nodes MUST have 2-3 multiple-choice questions with clear wrong options
- Order nodes logically (foundational → advanced)
- Every learn and checkpoint node MUST include an intuitive real-world analogy

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "title": "Journey title",
  "description": "1-sentence journey description",
  "nodes": [
    {
      "id": "node-1",
      "title": "Node title",
      "concept": "The core concept being taught",
      "content": "Detailed explanation (3-5 sentences, educational, clear)",
      "analogy": "Think of it like... [1-2 sentence real-world comparison that makes the concept click intuitively]",
      "type": "learn",
      "quiz": null
    },
    {
      "id": "node-2",
      "title": "Quiz: [topic]",
      "concept": "Testing understanding of [topic]",
      "content": "Let's check your understanding with a few questions.",
      "analogy": null,
      "type": "quiz",
      "quiz": {
        "questions": [
          {
            "id": "q1",
            "text": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0,
            "explanation": "Brief explanation of the correct answer"
          }
        ],
        "passingScore": 70
      }
    },
    {
      "id": "node-3",
      "title": "Checkpoint",
      "concept": "Summary and recap",
      "content": "Recap of the key points covered so far.",
      "analogy": "Think of this checkpoint like a pit stop in a race — a moment to consolidate what you have learned before pushing forward.",
      "type": "checkpoint",
      "quiz": null
    }
  ]
}`;


  try {
    const raw = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a learning journey from these notes:\n\nTitle: ${title || 'Study Notes'}\n\n${content.slice(0, 6000)}` }
    ]);

    let journey;
    try {
      // Strip potential markdown code fences
      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      journey = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ message: 'AI returned invalid JSON', raw: raw.slice(0, 300) });
    }

    // Stamp server-side fields
    const nodes = (journey.nodes || []).map((n, i) => ({
      ...n,
      id: `${journeyId}-node-${i + 1}`,
      isLocked: i !== 0,
      isCompleted: false,
      order: i,
    }));

    const record = {
      id: journeyId,
      notesId: notesId || null,
      title: journey.title || title || 'Learning Journey',
      description: journey.description || '',
      nodes,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
    };

    insert('journeys', record);

    // Create initial progress record
    insert('journey_progress', {
      id: uuidv4(),
      journeyId,
      userId: req.user.id,
      completedNodes: [],
      currentNodeId: nodes[0]?.id || null,
      progressPercentage: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    });

    res.json(record);
  } catch (err) {
    console.error('[Journey] Generate error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to generate journey' });
  }
});

// ── GET /api/journeys — list user's journeys ─────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const journeys = find('journeys', j => j.createdBy === req.user.id);
  const progresses = find('journey_progress', p => p.userId === req.user.id);
  const result = journeys.map(j => {
    const prog = progresses.find(p => p.journeyId === j.id) || { progressPercentage: 0 };
    return { ...j, progressPercentage: prog.progressPercentage, completed: prog.completedAt !== null };
  });
  res.json(result.reverse()); // newest first
});

// ── GET /api/journeys/:id ─────────────────────────────────────────────────────
router.get('/:id', authMiddleware, (req, res) => {
  const journey = findOne('journeys', j => j.id === req.params.id);
  if (!journey) return res.status(404).json({ message: 'Journey not found' });

  const progress = findOne('journey_progress', p => p.journeyId === req.params.id && p.userId === req.user.id);

  // Apply current user progress to node locked/completed states
  const completedSet = new Set(progress?.completedNodes || []);
  const nodes = journey.nodes.map((n, i) => ({
    ...n,
    isCompleted: completedSet.has(n.id),
    isLocked: i > 0 && !completedSet.has(journey.nodes[i - 1]?.id),
  }));

  res.json({ ...journey, nodes, progress: progress || null });
});

// ── POST /api/journeys/:id/progress ─────────────────────────────────────────
router.post('/:id/progress', authMiddleware, async (req, res) => {
  const { nodeId } = req.body;
  if (!nodeId) return res.status(400).json({ message: 'nodeId is required' });

  const journey = findOne('journeys', j => j.id === req.params.id);
  if (!journey) return res.status(404).json({ message: 'Journey not found' });

  let progress = findOne('journey_progress', p => p.journeyId === req.params.id && p.userId === req.user.id);
  if (!progress) return res.status(404).json({ message: 'Progress record not found' });

  // Prevent duplicates
  if (progress.completedNodes.includes(nodeId)) {
    return res.json({ progress, badge: null });
  }

  const updatedCompleted = [...progress.completedNodes, nodeId];
  const totalNodes = journey.nodes.length;
  const progressPct = Math.round((updatedCompleted.length / totalNodes) * 100);

  // Find next unlocked node
  const currentIdx = journey.nodes.findIndex(n => n.id === nodeId);
  const nextNode = journey.nodes[currentIdx + 1] || null;

  const isJourneyComplete = updatedCompleted.length >= totalNodes;

  const updatedProgress = update('journey_progress',
    p => p.journeyId === req.params.id && p.userId === req.user.id,
    {
      completedNodes: updatedCompleted,
      currentNodeId: nextNode?.id || null,
      progressPercentage: progressPct,
      completedAt: isJourneyComplete ? new Date().toISOString() : null,
    }
  );

  // Award badge on completion
  let badge = null;
  if (isJourneyComplete) {
    const { v4: uuidv4 } = require('uuid');
    badge = {
      id: uuidv4(),
      userId: req.user.id,
      journeyId: journey.id,
      title: `Journey Complete: ${journey.title}`,
      description: `Completed the ${journey.title} learning journey`,
      icon: '🏆',
      earnedAt: new Date().toISOString(),
    };
    insert('badges', badge);
  }

  res.json({ progress: updatedProgress, badge, nextNodeId: nextNode?.id || null, isComplete: isJourneyComplete });
});

// ── GET /api/journeys/badges/mine ─────────────────────────────────────────────
router.get('/badges/mine', authMiddleware, (req, res) => {
  const badges = find('badges', b => b.userId === req.user.id);
  res.json(badges);
});

// ── DELETE /api/journeys/:id ──────────────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  const journey = findOne('journeys', j => j.id === req.params.id);
  if (!journey) return res.status(404).json({ message: 'Journey not found' });
  if (journey.createdBy !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  remove('journeys', j => j.id === req.params.id);
  remove('journey_progress', p => p.journeyId === req.params.id);
  res.status(204).end();
});

module.exports = router;
