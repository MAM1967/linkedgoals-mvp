// Enhanced dashboard type definitions

export interface CoachingNote {
  id: string;
  goalId: string;
  coachId: string;
  coachName: string;
  note: string;
  createdAt: Date;
  isRead: boolean;
  type: "feedback" | "encouragement" | "suggestion" | "milestone";
}

export interface GoalProgress {
  goalId: string;
  percentage: number;
  status: "not-started" | "in-progress" | "completed" | "overdue";
  lastUpdated: Date;
  daysWithoutProgress?: number;
  coachingNotes?: CoachingNote[];
  hasUnreadCoachNotes: boolean;
}

export interface CategoryProgress {
  category: string;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  goals: GoalProgress[];
  hasCoachingAttention: boolean;
}

export interface DashboardInsights {
  overallProgress: number;
  weeklyProgress: number;
  stalledGoals: SmartGoal[];
  upcomingDeadlines: SmartGoal[];
  achievements: Achievement[];
  focusAreas: string[];
  recentCoachingFeedback: CoachingNote[];
  goalsWithCoachNotes: SmartGoal[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  type: "completion" | "milestone" | "streak" | "category";
  goalId?: string;
  category?: string;
}

export interface ProgressTrend {
  date: Date;
  overallProgress: number;
  categoryProgress: { [category: string]: number };
}

// Re-export types from Dashboard component for compatibility
export interface MeasurableData {
  type: string;
  targetValue: number | string | null;
  currentValue: number | string | boolean | null;
  unit?: string;
}

export interface SmartGoal {
  id: string;
  description: string;
  specific: string;
  measurable: MeasurableData;
  achievable: string;
  relevant: string;
  dueDate: string;
  createdAt: { toDate(): Date } | Date; // Firebase Timestamp
  status: string;
  completed: boolean;
  category?: string;
  coachUid?: string;
  coachName?: string;
  coachStatus?: string;
  lastProgressUpdateAt?: { toDate(): Date } | Date; // Firebase Timestamp
}
