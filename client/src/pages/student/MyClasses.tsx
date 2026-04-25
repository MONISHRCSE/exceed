import { useState, useEffect } from 'react';
import { classesAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Plus, X, Loader2, Users, BookOpen, Calendar,
  ChevronRight, Copy, CheckCircle2, FileText, Video, Search, Play
} from 'lucide-react';

export default function MyClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    classesAPI.my()
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError(null);
    try {
      await classesAPI.join(joinCode.trim());
      const updated = await classesAPI.my();
      setClasses(updated);
      setShowJoin(false); setJoinCode('');
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join');
    }
    setJoining(false);
  };

  const openClass = async (cls: any) => {
    setSelectedClass(cls);
    try {
      const s = await classesAPI.getSessions(cls.id);
      setSessions(s);
    } catch { setSessions([]); }
  };

  // ── Class detail view ──
  if (selectedClass) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
        {/* Header */}
        <div className="shrink-0 px-8 pt-6 pb-4 border-b border-surface-800">
          <button onClick={() => setSelectedClass(null)} className="text-xs text-surface-400 hover:text-surface-200 mb-3 flex items-center gap-1">
            ← Back to My Classes
          </button>
          <h1 className="text-2xl font-bold text-surface-50">{selectedClass.name}</h1>
          <p className="text-sm text-surface-400 mt-1">by {selectedClass.teacherName} · {selectedClass.memberCount} student{selectedClass.memberCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-16 text-surface-500">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-surface-600" />
                    <p className="text-sm">No sessions yet</p>
                  </div>
                ) : sessions.map(s => (
                  <div key={s.id} className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-surface-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-sm font-semibold text-surface-100">{s.title}</h3>
                        {s.description && <p className="text-xs text-surface-400 mt-1">{s.description}</p>}
                        <div className="flex items-center gap-2 mt-3">
                          {s.notes_id && (
                            <button onClick={() => navigate(`/student/notes/${s.notes_id}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg text-[10px] font-bold text-primary-400 hover:bg-primary-500/20 transition-all">
                              <FileText className="w-3 h-3" /> View Notes
                            </button>
                          )}
                          {s.recording_url && (
                            <a href={s.recording_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all">
                              <Play className="w-3 h-3" fill="currentColor" /> Play Recording
                            </a>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-surface-500 shrink-0">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Class list view ──
  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-xl" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
      <div className="shrink-0 px-8 pt-6 pb-4 flex items-center justify-between border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">My Classes</h1>
          <p className="text-sm text-surface-400 mt-0.5">Join a class to access sessions, notes, and materials.</p>
        </div>
        <button onClick={() => setShowJoin(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <Plus className="w-4 h-4" /> Join Class
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
              <GraduationCap className="w-12 h-12 text-surface-600 mb-4" />
              <p className="text-surface-300 font-medium">No classes yet</p>
              <p className="text-xs text-surface-500 mt-1 mb-4">Ask your teacher for a class code</p>
              <button onClick={() => setShowJoin(true)}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Join Class</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map(cls => (
                <button key={cls.id} onClick={() => openClass(cls)}
                  className="text-left bg-surface-900 border border-surface-800 rounded-2xl p-5 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-400" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-surface-100 group-hover:text-primary-100 transition-colors">{cls.name}</h3>
                  <p className="text-xs text-surface-500 mt-1">{cls.teacherName}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-surface-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.memberCount}</span>
                    <span>Joined {new Date(cls.joinedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-surface-50">Join a Class</h2>
              <button onClick={() => { setShowJoin(false); setJoinError(null); }}><X className="w-5 h-5 text-surface-400" /></button>
            </div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">Class Code</label>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. XK3F9D" maxLength={8}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-lg font-mono text-center text-surface-100 tracking-widest focus:outline-none focus:border-primary-500 uppercase" />
            {joinError && <p className="text-xs text-danger-400 mt-2">{joinError}</p>}
            <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
              className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : 'Join Class'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
