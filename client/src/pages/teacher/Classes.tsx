import { useState, useEffect } from 'react';
import { classesAPI } from '../../api';
import {
  GraduationCap, Plus, X, Loader2, Users, Copy, CheckCircle2,
  ChevronRight, BarChart3, BookOpen, Calendar, Upload, FileText, Play, Trash2
} from 'lucide-react';

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [className, setClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Detail view state
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'sessions' | 'analytics'>('students');

  useEffect(() => {
    classesAPI.my().then(setClasses).catch(() => setClasses([])).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!className.trim()) return;
    setCreating(true);
    try {
      await classesAPI.create(className.trim());
      const updated = await classesAPI.my();
      setClasses(updated);
      setShowCreate(false); setClassName('');
    } catch { /* ignore */ }
    setCreating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openClass = async (cls: any) => {
    setSelectedClass(cls); setActiveTab('students');
    try {
      const [detail, analyticsData, sess] = await Promise.all([
        classesAPI.get(cls.id),
        classesAPI.getAnalytics(cls.id).catch(() => null),
        classesAPI.getSessions(cls.id).catch(() => []),
      ]);
      setClassDetail(detail); setAnalytics(analyticsData); setSessions(sess);
    } catch { /* ignore */ }
  };



  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (sessionId: string, file: File) => {
    if (!selectedClass) return;
    setUploading(sessionId);
    try {
      await classesAPI.uploadRecording(selectedClass.id, sessionId, file);
      const sess = await classesAPI.getSessions(selectedClass.id);
      setSessions(sess);
    } catch (err) {
      alert('Upload failed');
    }
    setUploading(null);
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    if (!window.confirm(`Are you sure you want to delete the class "${selectedClass.name}"? This will remove all students and sessions.`)) return;
    try {
      await classesAPI.delete(selectedClass.id);
      const updated = await classesAPI.my();
      setClasses(updated);
      setSelectedClass(null);
    } catch (err: any) {
      alert('Failed to delete class: ' + (err.message || 'Unknown error'));
    }
  };

  // ── Class Detail View ──
  if (selectedClass) {
    const stats = analytics || { totalStudents: 0, activeStudents: 0, avgAccuracy: 0, totalAttempts: 0, students: [], topMistakes: [] };
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
        <div className="shrink-0 px-8 pt-6 pb-4 border-b border-surface-800">
          <button onClick={() => setSelectedClass(null)} className="text-xs text-surface-400 hover:text-surface-200 mb-3">← Back</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-50">{selectedClass.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <button onClick={() => copyCode(selectedClass.join_code)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded-lg text-xs font-mono text-primary-300 hover:bg-primary-500/20 transition-colors">
                  {copiedCode === selectedClass.join_code ? <><CheckCircle2 className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> {selectedClass.join_code}</>}
                </button>
                <span className="text-xs text-surface-500">{stats.totalStudents} students</span>
              </div>
            </div>
            <button 
              onClick={handleDeleteClass}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Class
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-8 pt-4 flex gap-1 border-b border-surface-800">
          {(['students', 'sessions', 'analytics'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors capitalize ${
                activeTab === tab ? 'bg-surface-900 text-surface-50 border border-b-0 border-surface-700' : 'text-surface-400 hover:text-surface-200'
              }`}>{tab}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-3">
                {stats.students?.length === 0 ? (
                  <div className="text-center py-16 text-surface-500"><Users className="w-10 h-10 mx-auto mb-3 text-surface-600" /><p className="text-sm">No students yet. Share the code!</p></div>
                ) : stats.students?.map((s: any) => (
                  <div key={s.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-400">
                      {s.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">{s.name}</p>
                      <p className="text-[10px] text-surface-500">{s.totalAttempts} attempts · Last active: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${s.accuracy >= 70 ? 'text-emerald-400' : s.accuracy >= 40 ? 'text-amber-400' : 'text-danger-400'}`}>{s.accuracy}%</p>
                      <p className="text-[9px] text-surface-500">accuracy</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div>
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <div className="text-center py-16 text-surface-500">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-surface-600" />
                      <p className="text-sm">No lecture sessions yet</p>
                      <p className="text-xs mt-1">Record a lecture and publish it to this class to create a session.</p>
                    </div>
                  ) : sessions.map(s => (
                    <div key={s.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-surface-100">{s.title}</h3>
                          {s.description && <p className="text-xs text-surface-400 mt-1">{s.description}</p>}
                          <p className="text-[10px] text-surface-500 mt-2">{new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {s.notes_id && (
                            <button onClick={() => window.location.href = `/teacher/notes/${s.notes_id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg text-[10px] font-bold text-primary-400 hover:bg-primary-500/20 transition-all">
                              <FileText className="w-3 h-3" /> View Notes
                            </button>
                          )}
                          {s.recording_url ? (
                            <a href={s.recording_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
                              <Play className="w-3 h-3" fill="currentColor" /> Play Recording
                            </a>
                          ) : (
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-[10px] font-bold text-surface-300 hover:bg-surface-700 cursor-pointer transition-all">
                              {uploading === s.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</> : <><Upload className="w-3 h-3" /> Upload Recording</>}
                              <input type="file" className="hidden" accept="video/*,audio/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(s.id, file);
                              }} disabled={!!uploading} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Students', value: stats.totalStudents, color: 'text-primary-400' },
                    { label: 'Active', value: stats.activeStudents, color: 'text-emerald-400' },
                    { label: 'Avg Accuracy', value: `${stats.avgAccuracy}%`, color: stats.avgAccuracy >= 70 ? 'text-emerald-400' : 'text-amber-400' },
                    { label: 'Total Attempts', value: stats.totalAttempts, color: 'text-accent-400' },
                  ].map((card, i) => (
                    <div key={i} className="bg-surface-900 border border-surface-800 rounded-xl p-5 text-center">
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-[10px] text-surface-500 mt-1 uppercase tracking-wider">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top Mistakes */}
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-surface-200 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-danger-400" /> Most Missed Concepts</h3>
                  {stats.topMistakes?.length === 0 ? (
                    <p className="text-xs text-surface-500">No mistake data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topMistakes?.slice(0, 5).map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-surface-500 w-5">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-surface-200 font-medium">{m.concept}</span>
                              <span className="text-danger-400 font-bold">{m.mistakes} errors</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                              <div className="h-full bg-danger-500 rounded-full" style={{ width: `${Math.min(100, (m.mistakes / (m.attempts || 1)) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Per-Student Breakdown */}
                <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-surface-200 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary-400" /> Student Breakdown</h3>
                  <div className="space-y-2">
                    {stats.students?.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-950/50 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-400">{s.name?.charAt(0)}</div>
                        <span className="text-xs font-medium text-surface-200 flex-1 truncate">{s.name}</span>
                        <span className="text-xs text-surface-500">{s.totalAttempts} tries</span>
                        <span className={`text-xs font-bold ${s.accuracy >= 70 ? 'text-emerald-400' : s.accuracy >= 40 ? 'text-amber-400' : 'text-danger-400'}`}>{s.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // ── Class List View ──
  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-xl" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
      <div className="shrink-0 px-8 pt-6 pb-4 flex items-center justify-between border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">My Classes</h1>
          <p className="text-sm text-surface-400 mt-0.5">Create, manage, and monitor your classes.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
              <GraduationCap className="w-12 h-12 text-surface-600 mb-4" />
              <p className="text-surface-300 font-medium">No classes created</p>
              <p className="text-xs text-surface-500 mt-1 mb-4">Create a class and share the code with students</p>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Create Class</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map(cls => (
                <button key={cls.id} onClick={() => openClass(cls)}
                  className="text-left bg-surface-900 border border-surface-800 rounded-2xl p-5 hover:border-primary-500/40 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-400" />
                    </div>
                    <button onClick={e => { e.stopPropagation(); copyCode(cls.join_code); }}
                      className="flex items-center gap-1 px-2 py-1 bg-surface-800 rounded-lg text-[10px] font-mono text-surface-400 hover:text-surface-200 transition-colors">
                      {copiedCode === cls.join_code ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {cls.join_code}
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-surface-100 group-hover:text-primary-100 transition-colors">{cls.name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-surface-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.memberCount} students</span>
                    <span>{new Date(cls.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-surface-50">Create Class</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-surface-400" /></button>
            </div>
            <input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Physics 101"
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-100 focus:outline-none focus:border-primary-500" />
            <button onClick={handleCreate} disabled={creating || !className.trim()}
              className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Class'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
