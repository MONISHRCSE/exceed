import { useState, useEffect } from 'react';
import { plannerAPI } from '../../../api';
import { StudyTask } from './types';
import { getMonthGrid, getWeekHealth, generateSuggestions } from './utils';
import { CalendarCell, TaskCard, IntelligencePanel } from './components';
import {
  ChevronLeft, ChevronRight, Sparkles, Scale, Trash2, Plus,
  Loader2, Calendar as CalIcon, X
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEAK_TOPICS = [
  { name: 'Kinematics', strength: 35 },
  { name: 'Derivatives', strength: 42 },
  { name: 'Cell Biology', strength: 55 },
];

export default function SmartPlannerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [balancing, setBalancing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayDrawer, setShowDayDrawer] = useState(false);

  // Add task form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<string>('revise');
  const [newSubject, setNewSubject] = useState('');
  const [newDuration, setNewDuration] = useState(30);

  const fetchTasks = () => {
    setLoading(true);
    plannerAPI.get()
      .then((data: any) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const cells = getMonthGrid(currentMonth, tasks);
  const selectedCell = cells.find(c => c.dateStr === selectedDate);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.scheduled_date === todayStr);
  const weekHealth = getWeekHealth(cells);
  const suggestions = generateSuggestions(cells);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await plannerAPI.generate({ weakTopics: WEAK_TOPICS.map(t => t.name) });
      fetchTasks();
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const handleBalance = async () => {
    setBalancing(true);
    try {
      await plannerAPI.balance();
      fetchTasks();
    } catch { /* ignore */ }
    setBalancing(false);
  };

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (!task.completed) {
      try { await plannerAPI.complete(id); } catch { /* ignore */ }
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completed_at: t.completed ? null : new Date().toISOString() } : t));
  };

  const handleDelete = async (id: string) => {
    try { await plannerAPI.remove(id); } catch { /* ignore */ }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleReschedule = async (id: string) => {
    const newDate = prompt('New date (YYYY-MM-DD):');
    if (!newDate || !/\d{4}-\d{2}-\d{2}/.test(newDate)) return;
    try { await plannerAPI.reschedule(id, newDate); } catch { /* ignore */ }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, scheduled_date: newDate } : t));
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const task = await plannerAPI.addTask({
        title: newTitle, scheduledDate: selectedDate, type: newType,
        subject: newSubject, duration: newDuration,
      });
      setTasks(prev => [...prev, task]);
    } catch { /* ignore */ }
    setNewTitle(''); setNewSubject(''); setShowAddModal(false);
  };

  const handleClearCompleted = () => {
    const completed = tasks.filter(t => t.completed);
    completed.forEach(t => plannerAPI.remove(t.id).catch(() => {}));
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const selectedDayTasks = tasks.filter(t => t.scheduled_date === selectedDate);
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const selectedLabel = selectedDate === todayStr ? 'Today'
    : selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-xl" /></div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950 animate-fade-in">

      {/* Left: Calendar + Actions */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-8 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">Smart Planner</h1>
            <p className="text-sm text-surface-400 mt-0.5">AI-powered study scheduling & workload balance.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleGenerate} disabled={generating}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate Plan
            </button>
            <button onClick={handleBalance} disabled={balancing}
              className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-surface-700">
              {balancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />} Balance
            </button>
            <button onClick={handleClearCompleted}
              className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-surface-700">
              <Trash2 className="w-3.5 h-3.5" /> Clear Done
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-surface-900 border border-surface-800 rounded-lg p-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-surface-200 min-w-[140px] text-center">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(todayStr); }}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium">Today</button>
            </div>

            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-7 gap-1.5 mb-3 text-center">
                {DAYS.map(d => <div key={d} className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, i) => (
                  <CalendarCell key={i} cell={cell} isSelected={cell.dateStr === selectedDate}
                    onClick={() => { setSelectedDate(cell.dateStr); setShowDayDrawer(true); }} />
                ))}
              </div>
            </div>

            {/* Selected Day Tasks (below calendar on small screens) */}
            <div className="mt-6 lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-surface-200">{selectedLabel} — {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}</h3>
                <button onClick={() => setShowAddModal(true)} className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {selectedDayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border border-surface-800 border-dashed rounded-xl bg-surface-900/50">
                    <CalIcon className="w-6 h-6 text-surface-600 mb-2" />
                    <p className="text-xs text-surface-500">No tasks scheduled</p>
                  </div>
                ) : selectedDayTasks.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={() => handleToggle(t.id)}
                    onReschedule={() => handleReschedule(t.id)} onDelete={() => handleDelete(t.id)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Intelligence + Day Tasks (desktop) */}
      <div className="w-[360px] xl:w-[400px] border-l border-surface-800 bg-surface-900/20 flex-col hidden lg:flex overflow-y-auto custom-scrollbar">
        {/* Day Tasks */}
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-surface-200">{selectedLabel}</h3>
            <button onClick={() => setShowAddModal(true)} className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 border border-surface-800 border-dashed rounded-xl bg-surface-900/50">
                <p className="text-[10px] text-surface-500">No tasks for this day</p>
              </div>
            ) : selectedDayTasks.map(t => (
              <TaskCard key={t.id} task={t} onToggle={() => handleToggle(t.id)}
                onReschedule={() => handleReschedule(t.id)} onDelete={() => handleDelete(t.id)} />
            ))}
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="p-6">
          <IntelligencePanel todayTasks={todayTasks} weekHealth={weekHealth}
            suggestions={suggestions} weakTopics={WEAK_TOPICS} />
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-50">Add Task — {selectedLabel}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-surface-400 hover:text-surface-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Revise Chapter 3"
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500">
                    <option value="revise">Revise</option><option value="quiz">Quiz</option>
                    <option value="flashcard">Flashcard</option><option value="practice">Practice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Duration (min)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(+e.target.value)} min={5} max={120}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5">Subject</label>
                <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. Physics"
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-surface-800 text-surface-200 text-sm font-medium rounded-xl hover:bg-surface-700 transition-colors">Cancel</button>
              <button onClick={handleAddTask}
                className="flex-1 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
