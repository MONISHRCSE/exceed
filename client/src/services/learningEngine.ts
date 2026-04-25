import { intelligenceAPI } from '../api';

export interface LearningStats {
  xp: number;
  level: number;
  accuracy: number;
  weeklyAccuracy: number;
  avgMastery: number;
  currentStreak: number;
  maxStreak: number;
  totalDaysActive: number;
  totalAttempts: number;
  totalCorrect: number;
  conceptsLearned: number;
  weakCount: number;
  totalConcepts: number;
}

export interface ConceptMastery {
  id: string;
  concept_id: string;
  subject: string;
  mastery_score: number;
  attempts: number;
  correct: number;
  mistake_count: number;
  last_reviewed: string;
}

/**
 * LearningEngine
 *
 * Central service for tracking performance.
 * Every question attempt flows through here.
 * Replaces all mock XP/accuracy/streak values.
 */
export const LearningEngine = {

  /** Log a single question attempt — call this from every practice mode */
  async logAttempt(
    conceptId: string,
    questionId: string,
    isCorrect: boolean,
    timeTaken?: number,
    subject?: string
  ) {
    try {
      return await intelligenceAPI.logAttempt({
        conceptId, questionId, isCorrect, timeTaken, subject
      });
    } catch (err) {
      console.error('LearningEngine.logAttempt failed:', err);
      return null;
    }
  },

  /** Get real computed stats (replaces all mock XP/accuracy/streak) */
  async getStats(): Promise<LearningStats> {
    try {
      return await intelligenceAPI.getStats();
    } catch {
      return {
        xp: 0, level: 1, accuracy: 0, weeklyAccuracy: 0, avgMastery: 0,
        currentStreak: 0, maxStreak: 0, totalDaysActive: 0,
        totalAttempts: 0, totalCorrect: 0,
        conceptsLearned: 0, weakCount: 0, totalConcepts: 0,
      };
    }
  },

  /** Get all concept masteries for the user */
  async getMastery(): Promise<ConceptMastery[]> {
    try {
      return await intelligenceAPI.getMastery();
    } catch {
      return [];
    }
  },

  /** Get dynamically detected weak topics */
  async getWeakTopics() {
    try {
      return await intelligenceAPI.getWeakTopics();
    } catch {
      return [];
    }
  },

  /** Get recent attempt history */
  async getHistory(limit?: number) {
    try {
      return await intelligenceAPI.getHistory(limit);
    } catch {
      return [];
    }
  },
};
