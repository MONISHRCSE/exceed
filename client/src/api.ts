const API_BASE = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('exceed_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  if (res.status === 204) return null as T
  return res.json()
}

// ── Auth API ──
export const authAPI = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; role: string; firstName: string; lastName: string } }>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (data: { email: string; password: string; role: string; firstName: string; lastName: string }) =>
    request<{ token: string; user: { id: string; email: string; role: string; firstName: string; lastName: string } }>('/auth/register', { method: 'POST', body: data }),

  verify: () =>
    request<{ user: { id: string; email: string; role: string; firstName: string; lastName: string } }>('/auth/verify'),
}

// ── Lectures API ──
export const lecturesAPI = {
  create: (data: { title: string; audioBlob?: Blob }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.audioBlob) formData.append('audio', data.audioBlob, 'lecture.webm')
    const token = localStorage.getItem('exceed_token')
    return fetch(`${API_BASE}/lectures`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json())
  },
  list: () => request<any[]>('/lectures'),
  get: (id: string) => request<any>(`/lectures/${id}`),
  transcribe: (id: string, transcript: string) =>
    request<any>(`/lectures/${id}/transcribe`, { method: 'POST', body: { transcript } }),
}

// ── Notes API ──
export const notesAPI = {
  refine: (lectureId: string, transcript: string) =>
    request<any>('/notes/refine', { method: 'POST', body: { lectureId, transcript } }),
  get: (id: string, language?: string) =>
    request<any>(`/notes/${id}${language ? `?language=${language}` : ''}`),
  update: (id: string, content: string) =>
    request<any>(`/notes/${id}`, { method: 'PUT', body: { content } }),
  translate: (id: string, languages: string[]) =>
    request<any>(`/notes/${id}/translate`, { method: 'POST', body: { languages } }),
  publish: (id: string) =>
    request<any>(`/notes/${id}/publish`, { method: 'POST' }),
  listForStudent: () => request<any[]>('/notes/student'),
  listForTeacher: () => request<any[]>('/notes/teacher'),
}

// ── Quiz API ──
export const quizAPI = {
  generate: (notesId: string) =>
    request<any>('/quiz/generate', { method: 'POST', body: { notesId } }),
  get: (id: string) => request<any>(`/quiz/${id}`),
  submit: (id: string, answers: number[]) =>
    request<any>(`/quiz/${id}/submit`, { method: 'POST', body: { answers } }),
  listForStudent: () => request<any[]>('/quiz/student'),
  results: () => request<any[]>('/quiz/results'),
}

// ── Flashcards API ──
export const flashcardsAPI = {
  getByNotes: (notesId: string) => request<any[]>(`/flashcards/notes/${notesId}`),
  markReviewed: (id: string) =>
    request<any>(`/flashcards/${id}/review`, { method: 'POST' }),
}

// ── Planner API ──
export const plannerAPI = {
  get: () => request<any[]>('/planner'),
  addTask: (task: { title: string; description: string; scheduledDate: string; type: string }) =>
    request<any>('/planner', { method: 'POST', body: task }),
  complete: (id: string) =>
    request<any>(`/planner/${id}/complete`, { method: 'PUT' }),
}

// ── Doubts API ──
export const doubtsAPI = {
  submit: (data: { lectureId: string; questionText: string; isVoice: boolean }) =>
    request<any>('/doubts', { method: 'POST', body: data }),
  listForStudent: () => request<any[]>('/doubts/student'),
  listForTeacher: () => request<any[]>('/doubts/teacher'),
  respond: (id: string, response: string) =>
    request<any>(`/doubts/${id}/respond`, { method: 'PUT', body: { response } }),
}

// ── Progress API ──
export const progressAPI = {
  get: () => request<any>('/progress'),
  getStudents: () => request<any[]>('/progress/students'),
}

// ── Analytics API ──
export const analyticsAPI = {
  teacher: () => request<any>('/analytics/teacher'),
  lecture: (id: string) => request<any>(`/analytics/lecture/${id}`),
}

// ── AI Integration API ──
export const aiAPI = {
  uploadPdf: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('exceed_token')
    return fetch(`${API_BASE}/ai/upload-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || `HTTP ${r.status}`);
      }
      return r.json();
    })
  },
  generateTutor: (docId: string) =>
    request<any>('/ai/generate-tutor', { method: 'POST', body: { docId } }),
  chat: (message: string, docId?: string) =>
    request<any>('/ai/chat', { method: 'POST', body: { message, docId } }),
  tts: (text: string) => {
    const token = localStorage.getItem('exceed_token')
    return fetch(`${API_BASE}/ai/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text }),
    })
  }
}
