export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: 'revise' | 'quiz' | 'flashcard' | 'practice';
  scheduled_date: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  source: 'auto' | 'manual';
  completed: boolean;
  completed_at: string | null;
  is_auto_generated: boolean;
  xp_reward: number;
}

export type ViewMode = 'month' | 'week';

export interface DayCellData {
  date: Date;
  dateStr: string;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  tasks: StudyTask[];
  totalDuration: number;
  completedCount: number;
}
