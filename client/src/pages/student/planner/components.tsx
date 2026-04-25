import { CheckCircle2, Circle, Clock, Sparkles, BookOpen, Brain, Layers, Flame, CalendarDays, ArrowRight, Trash2 } from 'lucide-react';
import { StudyTask, DayCellData } from './types';
import { getHeatColor } from './utils';

const TYPE_ICONS: Record<string, any> = { revise: BookOpen, quiz: Brain, flashcard: Layers, practice: Flame };
const TYPE_COLORS: Record<string, string> = {
  revise: 'bg-blue-500/10 text-blue-400', quiz: 'bg-purple-500/10 text-purple-400',
  flashcard: 'bg-emerald-500/10 text-emerald-400', practice: 'bg-amber-500/10 text-amber-400',
};
const PRIORITY_COLORS: Record<string, string> = { high: 'border-l-danger-500', medium: 'border-l-amber-500', low: 'border-l-surface-600' };

export function CalendarCell({ cell, isSelected, onClick }: { cell: DayCellData; isSelected: boolean; onClick: () => void }) {
  const heat = getHeatColor(cell.tasks.length);
  const progress = cell.tasks.length > 0 ? Math.round((cell.completedCount / cell.tasks.length) * 100) : 0;

  return (
    <button onClick={onClick}
      className={`relative h-20 rounded-xl flex flex-col items-center justify-start pt-2 gap-1 transition-all duration-200 border ${heat} ${
        isSelected ? 'bg-primary-500/15 border-primary-500/50 shadow-sm shadow-primary-500/10'
        : cell.isToday ? 'bg-surface-800/60 border-surface-700'
        : cell.isCurrentMonth ? 'border-transparent hover:bg-surface-800/40 hover:border-surface-700' : 'border-transparent opacity-30'
      }`}>
      <span className={`text-sm font-medium ${cell.isToday && !isSelected ? 'text-primary-400' : cell.isCurrentMonth ? 'text-surface-200' : 'text-surface-600'}`}>
        {cell.day}
      </span>
      {cell.tasks.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-surface-400 bg-surface-800 rounded px-1">{cell.tasks.length}</span>
          {progress > 0 && progress < 100 && (
            <div className="w-6 h-1 bg-surface-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          {progress === 100 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </div>
      )}
    </button>
  );
}

export function TaskCard({ task, onToggle, onReschedule, onDelete }: {
  task: StudyTask; onToggle: () => void; onReschedule: () => void; onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[task.type] || BookOpen;
  return (
    <div className={`group flex items-start gap-3 p-3.5 rounded-xl border border-l-[3px] transition-all duration-200 ${
      task.completed ? 'bg-surface-900/30 border-surface-800/50 opacity-50 hover:opacity-80' : `bg-surface-900 border-surface-800 hover:border-surface-700 ${PRIORITY_COLORS[task.priority] || ''}`
    }`}>
      <button onClick={onToggle} className="mt-0.5 shrink-0">
        {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-surface-600 group-hover:text-primary-500" />}
      </button>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium truncate ${task.completed ? 'text-surface-500 line-through' : 'text-surface-100'}`}>{task.title}</h4>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${TYPE_COLORS[task.type] || ''}`}>
            <Icon className="w-3 h-3" /> {task.type}
          </span>
          {task.subject && <span className="text-[10px] text-surface-500">{task.subject}</span>}
          <span className="flex items-center gap-1 text-[10px] text-surface-500"><Clock className="w-3 h-3" /> {task.duration}m</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.is_auto_generated && <Sparkles className="w-3 h-3 text-primary-500/60" />}
        <button onClick={onReschedule} className="p-1 hover:bg-surface-800 rounded" title="Reschedule">
          <CalendarDays className="w-3.5 h-3.5 text-surface-500 hover:text-primary-400" />
        </button>
        <button onClick={onDelete} className="p-1 hover:bg-surface-800 rounded" title="Delete">
          <Trash2 className="w-3.5 h-3.5 text-surface-500 hover:text-danger-400" />
        </button>
      </div>
    </div>
  );
}

export function IntelligencePanel({ todayTasks, weekHealth, suggestions, weakTopics }: {
  todayTasks: StudyTask[]; weekHealth: { overloaded: number; underutilized: number; consistency: number };
  suggestions: string[]; weakTopics: { name: string; strength: number }[];
}) {
  const completed = todayTasks.filter(t => t.completed).length;
  const totalMin = todayTasks.filter(t => !t.completed).reduce((s, t) => s + (t.duration || 0), 0);
  const pct = todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Today Summary */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Today</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-bold text-surface-100">{todayTasks.length}</p><p className="text-[10px] text-surface-500">Tasks</p></div>
          <div><p className="text-xl font-bold text-primary-400">{pct}%</p><p className="text-[10px] text-surface-500">Done</p></div>
          <div><p className="text-xl font-bold text-accent-400">{totalMin}m</p><p className="text-[10px] text-surface-500">Left</p></div>
        </div>
        {todayTasks.length > 0 && (
          <div className="mt-4 w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Week Health */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Week Health</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Overloaded days</span>
            <span className={weekHealth.overloaded > 0 ? 'text-danger-400 font-bold' : 'text-emerald-400 font-bold'}>{weekHealth.overloaded}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Free days</span>
            <span className="text-surface-200 font-bold">{weekHealth.underutilized}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Consistency</span>
            <span className={`font-bold ${weekHealth.consistency >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{weekHealth.consistency}%</span>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-400" /> Suggestions
        </h3>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <p key={i} className="text-xs text-surface-300 leading-relaxed flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-primary-500 shrink-0 mt-0.5" /> {s}
            </p>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      {weakTopics.length > 0 && (
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">Focus Areas</h3>
          <div className="space-y-3">
            {weakTopics.slice(0, 4).map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-surface-200 font-medium">{t.name}</span>
                  <span className="text-danger-400 font-bold">{t.strength}%</span>
                </div>
                <div className="w-full h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full" style={{ width: `${t.strength}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
