const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory store for document text contexts (mocking a vector DB)
const documentStore = {};

// ── Shared AI caller: tries Featherless, falls back to Groq ──────────────
async function callAI(messages, { temperature = 0.3, maxTokens = 3000 } = {}) {
  const featherlessKey = process.env.FEATHERLESS_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // Try Featherless first
  if (featherlessKey) {
    try {
      console.log('[AI] Trying Featherless...');
      const res = await fetch('https://api.featherless.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${featherlessKey}` },
        body: JSON.stringify({ model: 'Qwen/Qwen2.5-7B-Instruct', messages, temperature, max_tokens: maxTokens })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[AI] Featherless success');
        return data.choices[0].message.content;
      }
      const errText = await res.text();
      console.warn('[AI] Featherless failed:', errText, '— falling back to Groq');
    } catch (err) {
      console.warn('[AI] Featherless error:', err.message, '— falling back to Groq');
    }
  }

  // Fallback: Groq
  if (groqKey) {
    console.log('[AI] Using Groq | model: llama3-8b-8192');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({ model: 'llama3-8b-8192', messages, temperature, max_tokens: maxTokens })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    console.log('[AI] Groq success');
    return data.choices[0].message.content;
  }

  throw new Error('No AI provider configured. Set FEATHERLESS_API_KEY or GROQ_API_KEY in .env');
}

router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  console.log('[AI] Received PDF upload request');
  try {
    if (!req.file) {
      console.log('[AI] No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('[AI] Parsing PDF...', req.file.originalname, `(${req.file.size} bytes)`);
    const data = await pdfParse(req.file.buffer);
    const docId = uuidv4();
    
    documentStore[docId] = {
      filename: req.file.originalname,
      text: data.text,
      uploadedAt: new Date().toISOString()
    };
    
    res.json({ 
      docId, 
      filename: req.file.originalname, 
      message: 'PDF processed successfully',
      pages: data.numpages
    });
  } catch (err) {
    console.error('PDF processing error:', err);
    res.status(500).json({ message: 'Failed to process PDF' });
  }
});

// POST /api/ai/chat
// Contextual chat using the uploaded document
router.post('/chat', async (req, res) => {
  try {
    const { message, docId } = req.body;
    
    let contextText = '';
    if (docId && documentStore[docId]) {
      contextText = documentStore[docId].text;
    }
    
    const systemPrompt = `You are a helpful AI learning assistant. Answer the user's question contextually using the provided document text. 
You MUST respond with a valid JSON object containing exactly these keys:
"answer": A clear, detailed explanation.
"keyPoints": An array of 2-3 brief string takeaways.
"example": A simple analogy or example.
Do not wrap the JSON in markdown code blocks. Just output raw valid JSON.`;

    const userPrompt = `Document Context:\n${contextText ? contextText.substring(0, 6000) : 'No document uploaded. Answer from general knowledge.'}\n\nQuestion: ${message}`;

    const contentText = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.3 });

    let parsed;
    try {
      // Find JSON block if the model wrapped it in markdown
      const match = contentText.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Raw output:', contentText);
      // Fallback
      parsed = { answer: contentText, keyPoints: [], example: '' };
    }

    res.json({
      role: 'assistant',
      content: parsed.answer,
      structuredResponse: {
        answer: parsed.answer,
        keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : undefined,
        example: parsed.example || undefined
      }
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Chat generation failed' });
  }
});

// POST /api/ai/generate-tutor
// Generates an interactive tutor session (steps) from the uploaded document
router.post('/generate-tutor', async (req, res) => {
  try {
    const { docId } = req.body;
    let contextText = '';
    
    if (docId && documentStore[docId]) {
      contextText = documentStore[docId].text;
    } else {
      return res.status(400).json({ message: 'Valid document required' });
    }

    const systemPrompt = `You are an AI Tutor creating an interactive lesson plan.
Based on the provided document text, extract the core concepts and create a step-by-step learning path.
You MUST output a valid JSON array of objects, where each object represents a step in the lesson.
There are two types of steps: "teach" and "ask". Alternate between teaching a concept and asking a question.

Each "teach" object must exactly match this format:
{
  "id": "unique-id",
  "type": "teach",
  "heading": "Concept Name",
  "content": "A short, engaging explanation of the concept (2-3 sentences max).",
  "keyPoints": ["Point 1", "Point 2"],
  "example": "A simple analogy."
}

Each "ask" object must exactly match this format:
{
  "id": "unique-id",
  "type": "ask",
  "content": "Let's check your understanding.",
  "question": {
    "type": "mcq",
    "text": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact string of the correct option",
    "hint": "A helpful hint."
  }
}

Generate exactly 4 steps (Teach -> Ask -> Teach -> Ask).
Do NOT wrap the response in markdown code blocks. Just output raw valid JSON array.`;

    const userPrompt = `Document Context (first 6000 chars):\n${contextText.substring(0, 6000)}\n\nCreate the lesson plan array.`;

    const contentText = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.3 });

    let parsed;
    try {
      const match = contentText.match(/\[[\s\S]*\]/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error in generate-tutor:', e);
      return res.status(500).json({ message: 'Failed to parse AI output into lesson plan' });
    }

    res.json({ steps: parsed });
  } catch (err) {
    console.error('Tutor generation error:', err);
    res.status(500).json({ message: 'Tutor generation failed' });
  }
});

// POST /api/ai/voice-chat
// Conversational AI for voice tutor — returns plain text answer for TTS
router.post('/voice-chat', async (req, res) => {
  try {
    const { message, history = [], context } = req.body;

    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Featherless API key missing' });
    }

    const contextBlock = context
      ? `\n\nThe student is currently studying the following notes — base your answers on this material:\n---\n${context.substring(0, 5000)}\n---\nIf the question relates to this content, answer from it directly. If it is unrelated, answer from your general knowledge.`
      : '';

    const systemPrompt = `You are Exceed, a knowledgeable AI tutor having a spoken conversation with a student.

Rules you MUST follow:
1. Answer DIRECTLY and ACCURATELY — do not make up facts.
2. Keep answers to 3-5 natural spoken sentences. No lists, no markdown, no bullet points.
3. Use simple, clear language suitable for text-to-speech — avoid symbols like *, #, >, etc.
4. If you don't know something, say so honestly and briefly.
5. Stay focused on what was asked — don't pad with unnecessary information.
6. Sound like a real teacher talking, not a textbook.${contextBlock}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages,
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Featherless voice-chat error:', errText);
      return res.status(response.status).json({ message: 'AI request failed' });
    }

    const data = await response.json();
    const answer = data.choices[0].message.content.trim()
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/#+/g, '').replace(/`/g, '');

    res.json({ answer });
  } catch (err) {
    console.error('voice-chat error:', err);
    res.status(500).json({ message: 'Voice chat failed' });
  }
});

// POST /api/ai/tts
// Convert text to speech using ElevenLabs
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body; // Default voice: Rachel
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        message: 'ElevenLabs API key is missing. Please set ELEVENLABS_API_KEY in the backend .env file.',
        missingKey: true 
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Error:', errorText);
      return res.status(response.status).json({ message: 'ElevenLabs TTS failed' });
    }

    // Stream the audio buffer back to client
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ message: 'TTS generation failed' });
  }
});

// POST /api/ai/generate-story-map
// Generates a Treasure Hunt story map (nodes + edges) from an uploaded PDF
router.post('/generate-story-map', async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId || !documentStore[docId]) {
      return res.status(400).json({ message: 'Valid document ID required. Upload a PDF first.' });
    }
    const contextText = documentStore[docId].text;

    const systemPrompt = `You are an AI that converts study notes into a gamified learning treasure hunt.
Analyze the document and extract the most important concepts. Create a directed learning graph with nodes and edges.

You MUST output a valid JSON object with exactly two keys: "nodes" and "edges".

Each node in "nodes" must match this format:
{
  "id": "n1",
  "type": "concept" | "quiz" | "boss" | "start",
  "title": "Short concept title",
  "description": "2-3 sentence explanation of this concept",
  "unlocked": true or false (only the first node "start" type is unlocked=true by default),
  "completed": false,
  "xp": 50,
  "question": {
    "type": "mcq" | "open",
    "text": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], (only for type: "mcq")
    "correctAnswer": "The exact string of correct option" (only for type: "mcq"),
    "explanation": "Why this answer is correct or what to look for"
  }
}

Node types:
- "start": The introductory node. No question.
- "concept": Key concept. ALWAYS use "open" question type.
- "quiz": Checkpoint. ALWAYS use "open" question type.
- "boss": Final challenge. ALWAYS use "open" question type.

Each edge in "edges" must match this format:
{ "from": "n1", "to": "n2" }

CRITICAL RULES for Graph Structure:
- You MUST create a branching path. From the "start" node (n1), it should divide into at least TWO parallel paths (e.g., n1 -> n2 AND n1 -> n3).
- These parallel paths should explore different sub-topics before potentially merging back at a "quiz" or "boss" node.
- Total nodes: 12-15.
- ALL questions must be "type": "open". DO NOT generate multiple choice options. The student will type their answer.
- Output raw valid JSON only.
`;

    const userPrompt = `Document Content (first 6000 chars):\n${contextText.substring(0, 6000)}\n\nGenerate the complex story map JSON.`;

    const contentText = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.4, maxTokens: 3000 });

    let parsed;
    try {
      const match = contentText.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error in generate-story-map:', e, '\nRaw output:', contentText);
      return res.status(500).json({ message: 'Failed to parse AI story map output' });
    }

    // Ensure start node is unlocked
    if (parsed.nodes && parsed.nodes.length > 0) {
      parsed.nodes[0].unlocked = true;
      parsed.nodes[0].completed = false;
    }

    res.json({
      storyMap: parsed,
      filename: documentStore[docId].filename
    });
  } catch (err) {
    console.error('Story map generation error:', err);
    res.status(500).json({ message: 'Story map generation failed' });
  }
});

// POST /api/ai/evaluate-answer
// Evaluates an open-ended answer using AI and document context
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { docId, question, userAnswer } = req.body;
    if (!docId || !documentStore[docId]) return res.status(400).json({ message: 'Document context lost' });
    
    const contextText = documentStore[docId].text;

    const systemPrompt = `You are a strict teacher evaluating a student's answer based ON THE PROVIDED DOCUMENT.
You MUST output a valid JSON object with exactly these keys:
"score": A number between 0 and 100.
"isCorrect": true (if score >= 70) or false.
"feedback": A short explanation of why the answer is correct or what was missed.
Do not wrap in markdown code blocks.`;

    const userPrompt = `Document Context:\n${contextText.substring(0, 6000)}\n\nQuestion: ${question}\nStudent's Answer: ${userAnswer}\n\nEvaluate the answer.`;

    const contentText = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.2 });

    let parsed;
    try {
      const match = contentText.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error in evaluate-answer:', e);
      return res.status(500).json({ message: 'Failed to parse evaluation' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ message: 'Evaluation failed' });
  }
});

// ── POST /api/ai/translate — Translate note content via Langbly ──
router.post('/translate', async (req, res) => {
  const { text, targetLang, sourceLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ message: 'text and targetLang are required' });
  }

  const apiKey = process.env.LANGBLY_API_KEY;
  const isMock = process.env.MOCK_DATA === '1' || !apiKey || apiKey.includes('your-langbly-api-key');

  // ── Mock Mode ──
  if (isMock) {
    console.log(`[AI] Mocking translation to ${targetLang}...`);
    // Simulate latency
    await new Promise(r => setTimeout(r, 800));
    
    const mockPrefixes = {
      hi: '[अनुवादित] ',
      es: '[Traducido] ',
      fr: '[Traduit] ',
      ar: '[مترجم] ',
      zh: '[翻译] ',
    };
    const prefix = mockPrefixes[targetLang] || `[${targetLang.toUpperCase()}] `;
    
    // Simple mock: just prefix the text (or some lines) to show it worked
    const mockedText = text.split('\n').map(line => {
      if (line.trim().startsWith('#') || line.trim().startsWith('-')) return line;
      return prefix + line;
    }).join('\n');
    
    return res.json({ translatedText: mockedText });
  }

  try {
    // Langbly limit: 10,000 chars per request. Split large notes into chunks.
    const CHUNK_SIZE = 8000;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    const translatedChunks = await Promise.all(chunks.map(async (chunk) => {
      const response = await fetch('https://api.langbly.com/language/translate/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          q: chunk,
          target: targetLang,
          ...(sourceLang ? { source: sourceLang } : {}),
          format: 'text',
          context: 'educational study notes with markdown formatting',
          instructions: 'Preserve all markdown formatting (##, **, -, etc). Keep technical terms accurate.',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Langbly error ${response.status}`);
      }

      const data = await response.json();
      return data.data?.translations?.[0]?.translatedText || chunk;
    }));

    res.json({ translatedText: translatedChunks.join('') });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ message: err.message || 'Translation failed' });
  }
});

module.exports = router;
