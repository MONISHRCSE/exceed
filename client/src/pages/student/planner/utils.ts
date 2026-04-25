import { DayCellData } from './types';

export function getMonthGrid(currentMonth: Date, tasks: any[]): DayCellData[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const cells: DayCellData[] = [];

  // Previous month fill
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLast - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
    cells.push({
      date: d, dateStr, day: prevMonthLast - i, isToday: false,
      isCurrentMonth: false, tasks: dayTasks,
      totalDuration: dayTasks.reduce((s: number, t: any) => s + (t.duration || 0), 0),
      completedCount: dayTasks.filter((t: any) => t.completed).length,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
    cells.push({
      date, dateStr, day: d, isToday: dateStr === todayStr,
      isCurrentMonth: true, tasks: dayTasks,
      totalDuration: dayTasks.reduce((s: number, t: any) => s + (t.duration || 0), 0),
      completedCount: dayTasks.filter((t: any) => t.completed).length,
    });
  }

  // Next month fill
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
    cells.push({
      date, dateStr, day: d, isToday: false,
      isCurrentMonth: false, tasks: dayTasks,
      totalDuration: dayTasks.reduce((s: number, t: any) => s + (t.duration || 0), 0),
      completedCount: dayTasks.filter((t: any) => t.completed).length,
    });
  }

  return cells;
}

export function getHeatColor(taskCount: number): string {
  if (taskCount === 0) return '';
  if (taskCount <= 1) return 'bg-primary-500/5';
  if (taskCount <= 2) return 'bg-primary-500/10';
  if (taskCount <= 3) return 'bg-primary-500/20';
  return 'bg-accent-500/20';
}

export function getWeekHealth(cells: DayCellData[]) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekCells = cells.filter(c => c.date >= weekStart && c.date <= weekEnd && c.isCurrentMonth);
  const overloaded = weekCells.filter(c => c.tasks.length > 3).length;
  const underutilized = weekCells.filter(c => c.tasks.length === 0).length;
  const totalTasks = weekCells.reduce((s, c) => s + c.tasks.length, 0);
  const avgPerDay = weekCells.length > 0 ? totalTasks / weekCells.length : 0;
  const consistency = weekCells.length > 0
    ? Math.round(100 - (weekCells.filter(c => Math.abs(c.tasks.length - avgPerDay) > 1.5).length / weekCells.length) * 100)
    : 0;
  return { overloaded, underutilized, consistency };
}

export function generateSuggestions(cells: DayCellData[]): string[] {
  const suggestions: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const todayCell = cells.find(c => c.dateStr === today);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowCell = cells.find(c => c.dateStr === tomorrowStr);

  if (tomorrowCell && tomorrowCell.tasks.length > 4) suggestions.push(`Tomorrow has ${tomorrowCell.tasks.length} tasks — consider moving some.`);
  if (todayCell && todayCell.tasks.length === 0) suggestions.push('No tasks today. Add a review session?');
  if (todayCell && todayCell.completedCount === todayCell.tasks.length && todayCell.tasks.length > 0) suggestions.push('All tasks done today! Great work.');

  const emptyDays = cells.filter(c => c.isCurrentMonth && c.tasks.length === 0 && c.date > new Date()).length;
  if (emptyDays > 5) suggestions.push(`${emptyDays} empty days ahead. Generate a smart plan.`);

  if (suggestions.length === 0) suggestions.push('Your schedule looks balanced. Keep it up!');
  return suggestions;
}
