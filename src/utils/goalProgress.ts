import {
  MeasurableData,
  SmartGoal,
  GoalProgress,
  CategoryProgress,
  DashboardInsights,
  Achievement,
  CoachingNote,
} from "../types/Dashboard";

/**
 * Calculate individual goal progress percentage based on SMART criteria
 * @param measurable - The measurable data for the goal
 * @param isCompleted - Whether the goal is marked as completed
 * @returns Progress percentage (0-100)
 */
export const calculateGoalProgress = (
  measurable: MeasurableData,
  isCompleted: boolean = false
): number => {
  if (isCompleted) return 100;

  if (!measurable || !measurable.type) return 0;

  const { type, currentValue, targetValue } = measurable;

  try {
    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const current = typeof currentValue === "number" ? currentValue : 0;
        const target = typeof targetValue === "number" ? targetValue : 1;
        if (target <= 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
      }

      case "Boolean": {
        return currentValue === true ? 100 : 0;
      }

      case "Date": {
        if (!targetValue || typeof targetValue !== "string") return 0;

        const now = new Date();
        const targetDate = new Date(targetValue);
        const createdDate = new Date(); // Would ideally come from goal creation date

        if (targetDate <= now) return 100; // Past due date

        const totalTime = targetDate.getTime() - createdDate.getTime();
        const elapsedTime = now.getTime() - createdDate.getTime();

        if (totalTime <= 0) return 0;
        return Math.min(Math.round((elapsedTime / totalTime) * 100), 100);
      }

      default:
        return 0;
    }
  } catch (error) {
    console.error("Error calculating goal progress:", error);
    return 0;
  }
};

/**
 * Calculate days without progress for a goal
 * @param lastProgressUpdate - Last progress update timestamp
 * @returns Number of days without progress
 */
export const calculateDaysWithoutProgress = (
  lastProgressUpdate?: { toDate(): Date } | Date
): number => {
  if (!lastProgressUpdate) return 0;

  const lastUpdate =
    typeof lastProgressUpdate === "object" && "toDate" in lastProgressUpdate
      ? lastProgressUpdate.toDate()
      : (lastProgressUpdate as Date);

  const now = new Date();
  const diffTime = now.getTime() - lastUpdate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(diffDays, 0);
};

/**
 * Determine goal status based on progress and dates
 * @param goal - The SmartGoal object
 * @param progressPercentage - Calculated progress percentage
 * @returns Goal status
 */
export const determineGoalStatus = (
  goal: SmartGoal,
  progressPercentage: number
): GoalProgress["status"] => {
  if (goal.completed || progressPercentage >= 100) {
    return "completed";
  }

  const dueDate = new Date(goal.dueDate);
  const now = new Date();

  if (dueDate < now) {
    return "overdue";
  }

  if (progressPercentage > 0) {
    return "in-progress";
  }

  return "not-started";
};

/**
 * Convert SmartGoal to GoalProgress with enhanced tracking
 * @param goal - The SmartGoal object
 * @param coachingNotes - Associated coaching notes
 * @returns GoalProgress object
 */
export const createGoalProgress = (
  goal: SmartGoal,
  coachingNotes: CoachingNote[] = []
): GoalProgress => {
  const percentage = calculateGoalProgress(goal.measurable, goal.completed);
  const status = determineGoalStatus(goal, percentage);
  const daysWithoutProgress = calculateDaysWithoutProgress(
    goal.lastProgressUpdateAt
  );
  const hasUnreadCoachNotes = coachingNotes.some((note) => !note.isRead);

  return {
    goalId: goal.id,
    percentage,
    status,
    lastUpdated: goal.lastProgressUpdateAt
      ? typeof goal.lastProgressUpdateAt === "object" &&
        "toDate" in goal.lastProgressUpdateAt
        ? goal.lastProgressUpdateAt.toDate()
        : (goal.lastProgressUpdateAt as Date)
      : new Date(),
    daysWithoutProgress,
    coachingNotes,
    hasUnreadCoachNotes,
  };
};

/**
 * Calculate category-level progress aggregation
 * @param goals - Array of SmartGoals
 * @param coachingNotes - Map of coaching notes by goal ID
 * @returns CategoryProgress map
 */
export const calculateCategoryProgress = (
  goals: SmartGoal[],
  coachingNotesByGoal: Map<string, CoachingNote[]> = new Map()
): Map<string, CategoryProgress> => {
  const categoryMap = new Map<string, CategoryProgress>();

  goals.forEach((goal) => {
    const category = goal.category || "Uncategorized";
    const goalCoachingNotes = coachingNotesByGoal.get(goal.id) || [];
    const goalProgress = createGoalProgress(goal, goalCoachingNotes);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        totalGoals: 0,
        completedGoals: 0,
        averageProgress: 0,
        goals: [],
        hasCoachingAttention: false,
      });
    }

    const categoryData = categoryMap.get(category)!;
    categoryData.totalGoals++;
    categoryData.goals.push(goalProgress);

    if (goalProgress.status === "completed") {
      categoryData.completedGoals++;
    }

    if (goalProgress.hasUnreadCoachNotes || goalCoachingNotes.length > 0) {
      categoryData.hasCoachingAttention = true;
    }
  });

  // Calculate average progress for each category
  categoryMap.forEach((categoryData) => {
    if (categoryData.goals.length > 0) {
      const totalProgress = categoryData.goals.reduce(
        (sum, goal) => sum + goal.percentage,
        0
      );
      categoryData.averageProgress = Math.round(
        totalProgress / categoryData.goals.length
      );
    }
  });

  return categoryMap;
};

/**
 * Calculate overall progress across all goals
 * @param goals - Array of SmartGoals
 * @returns Overall progress object
 */
export const calculateOverallProgress = (
  goals: SmartGoal[]
): {
  completed: number;
  total: number;
  percentage: number;
  averageProgress: number;
} => {
  if (goals.length === 0) {
    return { completed: 0, total: 0, percentage: 0, averageProgress: 0 };
  }

  let completed = 0;
  let totalProgress = 0;

  goals.forEach((goal) => {
    const progress = calculateGoalProgress(goal.measurable, goal.completed);
    totalProgress += progress;

    if (goal.completed || progress >= 100) {
      completed++;
    }
  });

  const completionPercentage = Math.round((completed / goals.length) * 100);
  const averageProgress = Math.round(totalProgress / goals.length);

  return {
    completed,
    total: goals.length,
    percentage: completionPercentage,
    averageProgress,
  };
};

/**
 * Identify stalled goals (no progress for X days)
 * @param goals - Array of SmartGoals
 * @param stalledThresholdDays - Days without progress to consider stalled
 * @returns Array of stalled goals
 */
export const identifyStalledGoals = (
  goals: SmartGoal[],
  stalledThresholdDays: number = 7
): SmartGoal[] => {
  return goals.filter((goal) => {
    if (goal.completed) return false;

    const daysWithoutProgress = calculateDaysWithoutProgress(
      goal.lastProgressUpdateAt
    );
    return daysWithoutProgress >= stalledThresholdDays;
  });
};

/**
 * Identify goals with upcoming deadlines
 * @param goals - Array of SmartGoals
 * @param daysAhead - Number of days to look ahead
 * @returns Array of goals with upcoming deadlines
 */
export const identifyUpcomingDeadlines = (
  goals: SmartGoal[],
  daysAhead: number = 7
): SmartGoal[] => {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return goals.filter((goal) => {
    if (goal.completed) return false;

    const dueDate = new Date(goal.dueDate);
    return dueDate >= now && dueDate <= threshold;
  });
};

/**
 * Generate dashboard insights based on goal data
 * @param goals - Array of SmartGoals
 * @param coachingNotes - Array of all coaching notes
 * @returns DashboardInsights object
 */
export const generateDashboardInsights = (
  goals: SmartGoal[],
  coachingNotes: CoachingNote[] = []
): DashboardInsights => {
  const overallProgress = calculateOverallProgress(goals);
  const stalledGoals = identifyStalledGoals(goals);
  const upcomingDeadlines = identifyUpcomingDeadlines(goals);

  // Get recent coaching feedback (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCoachingFeedback = coachingNotes.filter(
    (note) => note.createdAt >= weekAgo
  );

  // Identify goals with coaching notes
  const goalIdsWithNotes = new Set(coachingNotes.map((note) => note.goalId));
  const goalsWithCoachNotes = goals.filter((goal) =>
    goalIdsWithNotes.has(goal.id)
  );

  // Calculate weekly progress (would need historical data in real implementation)
  const weeklyProgress = overallProgress.averageProgress; // Simplified for MVP

  // Identify focus areas (categories with lowest progress)
  const categoryProgress = calculateCategoryProgress(goals);
  const focusAreas = Array.from(categoryProgress.values())
    .filter((cat) => cat.averageProgress < 50)
    .sort((a, b) => a.averageProgress - b.averageProgress)
    .slice(0, 3)
    .map((cat) => cat.category);

  // Generate achievements (simplified for MVP)
  const achievements: Achievement[] = [];
  goals.forEach((goal) => {
    if (goal.completed) {
      achievements.push({
        id: `completion-${goal.id}`,
        title: "Goal Completed!",
        description: `Completed: ${goal.specific}`,
        achievedAt: goal.lastProgressUpdateAt
          ? typeof goal.lastProgressUpdateAt === "object" &&
            "toDate" in goal.lastProgressUpdateAt
            ? goal.lastProgressUpdateAt.toDate()
            : (goal.lastProgressUpdateAt as Date)
          : new Date(),
        type: "completion",
        goalId: goal.id,
        category: goal.category,
      });
    }
  });

  return {
    overallProgress: overallProgress.averageProgress,
    weeklyProgress,
    stalledGoals,
    upcomingDeadlines,
    achievements,
    focusAreas,
    recentCoachingFeedback,
    goalsWithCoachNotes,
  };
};

/**
 * Generate motivational message based on progress
 * @param insights - DashboardInsights object
 * @returns Motivational message string
 */
export const generateMotivationalMessage = (
  insights: DashboardInsights
): string => {
  const { overallProgress, achievements, stalledGoals } = insights;

  if (overallProgress >= 90) {
    return "🌟 Incredible! You're almost at 100% - keep pushing!";
  } else if (overallProgress >= 70) {
    return "🚀 Amazing progress! You're in the final stretch!";
  } else if (overallProgress >= 50) {
    return "💪 Great momentum! You're over halfway there!";
  } else if (overallProgress >= 25) {
    return "📈 Good start! Keep building that momentum!";
  } else if (achievements.length > 0) {
    return "🎉 Celebrating your recent achievements - keep it up!";
  } else if (stalledGoals.length > 0) {
    return "💡 Time to re-energize those stalled goals - you've got this!";
  } else {
    return "🎯 Ready to make progress? Every step counts!";
  }
};
