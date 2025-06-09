import { useState, useEffect, useMemo } from "react";
import {
  SmartGoal,
  CoachingNote,
  DashboardInsights,
  CategoryProgress,
  GoalProgress,
} from "../types/Dashboard";
import {
  calculateCategoryProgress,
  calculateOverallProgress,
  generateDashboardInsights,
  generateMotivationalMessage,
  createGoalProgress,
} from "../utils/goalProgress";

interface UseGoalProgressReturn {
  categoryProgress: Map<string, CategoryProgress>;
  overallProgress: {
    completed: number;
    total: number;
    percentage: number;
    averageProgress: number;
  };
  insights: DashboardInsights;
  motivationalMessage: string;
  goalProgressMap: Map<string, GoalProgress>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing goal progress calculations and insights
 * @param goals - Array of SmartGoals
 * @param coachingNotes - Array of coaching notes
 * @returns Dashboard progress data and insights
 */
export const useGoalProgress = (
  goals: SmartGoal[],
  coachingNotes: CoachingNote[] = []
): UseGoalProgressReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create coaching notes map by goal ID for efficient lookup
  const coachingNotesByGoal = useMemo(() => {
    const noteMap = new Map<string, CoachingNote[]>();

    coachingNotes.forEach((note) => {
      if (!noteMap.has(note.goalId)) {
        noteMap.set(note.goalId, []);
      }
      noteMap.get(note.goalId)!.push(note);
    });

    return noteMap;
  }, [coachingNotes]);

  // Calculate category progress
  const categoryProgress = useMemo(() => {
    try {
      return calculateCategoryProgress(goals, coachingNotesByGoal);
    } catch (err) {
      console.error("Error calculating category progress:", err);
      setError("Failed to calculate category progress");
      return new Map<string, CategoryProgress>();
    }
  }, [goals, coachingNotesByGoal]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    try {
      return calculateOverallProgress(goals);
    } catch (err) {
      console.error("Error calculating overall progress:", err);
      setError("Failed to calculate overall progress");
      return { completed: 0, total: 0, percentage: 0, averageProgress: 0 };
    }
  }, [goals]);

  // Generate dashboard insights
  const insights = useMemo(() => {
    try {
      return generateDashboardInsights(goals, coachingNotes);
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights");
      return {
        overallProgress: 0,
        weeklyProgress: 0,
        stalledGoals: [],
        upcomingDeadlines: [],
        achievements: [],
        focusAreas: [],
        recentCoachingFeedback: [],
        goalsWithCoachNotes: [],
      };
    }
  }, [goals, coachingNotes]);

  // Generate motivational message
  const motivationalMessage = useMemo(() => {
    try {
      return generateMotivationalMessage(insights);
    } catch (err) {
      console.error("Error generating motivational message:", err);
      return "🎯 Keep working towards your goals!";
    }
  }, [insights]);

  // Create goal progress map for easy lookup
  const goalProgressMap = useMemo(() => {
    const progressMap = new Map<string, GoalProgress>();

    try {
      goals.forEach((goal) => {
        const goalCoachingNotes = coachingNotesByGoal.get(goal.id) || [];
        const progress = createGoalProgress(goal, goalCoachingNotes);
        progressMap.set(goal.id, progress);
      });
    } catch (err) {
      console.error("Error creating goal progress map:", err);
      setError("Failed to process goal progress");
    }

    return progressMap;
  }, [goals, coachingNotesByGoal]);

  // Manage loading state
  useEffect(() => {
    if (goals.length >= 0) {
      // Allow for empty goals array
      setLoading(false);
      setError(null);
    }
  }, [goals]);

  return {
    categoryProgress,
    overallProgress,
    insights,
    motivationalMessage,
    goalProgressMap,
    loading,
    error,
  };
};

/**
 * Hook for getting progress data for a specific goal
 * @param goalId - Goal ID to get progress for
 * @param goals - Array of SmartGoals
 * @param coachingNotes - Array of coaching notes
 * @returns Goal progress data or null if not found
 */
export const useGoalProgressById = (
  goalId: string,
  goals: SmartGoal[],
  coachingNotes: CoachingNote[] = []
): GoalProgress | null => {
  return useMemo(() => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const goalCoachingNotes = coachingNotes.filter(
      (note) => note.goalId === goalId
    );
    return createGoalProgress(goal, goalCoachingNotes);
  }, [goalId, goals, coachingNotes]);
};

/**
 * Hook for getting category-specific progress data
 * @param category - Category name
 * @param goals - Array of SmartGoals
 * @param coachingNotes - Array of coaching notes
 * @returns Category progress data or null if not found
 */
export const useCategoryProgress = (
  category: string,
  goals: SmartGoal[],
  coachingNotes: CoachingNote[] = []
): CategoryProgress | null => {
  const { categoryProgress } = useGoalProgress(goals, coachingNotes);

  return useMemo(() => {
    return categoryProgress.get(category) || null;
  }, [categoryProgress, category]);
};
