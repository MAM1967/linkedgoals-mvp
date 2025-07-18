// src/types.ts
export interface CheckinData {
  circle: string;
  message: string;
  goalId?: string | null;
  goal?: {
    name: string;
    description: string;
    dueDate?: string;
    completed: boolean;
  };
}

// Freemium Plan Types
export type PlanType = "free" | "premium" | "trial";

export interface PlanLimits {
  maxGoals: number;
  features: string[];
  analyticsAccess: boolean;
  collaborationAccess: boolean;
  prioritySupport: boolean;
}

export interface UserPlan {
  planType: PlanType;
  goalCount: number;
  planLimits: PlanLimits;
  subscriptionStatus?: "active" | "canceled" | "past_due";
  waitlistSignup?: boolean;
  planStartedAt?: Date;
}

// Goal Limit Validation
export interface GoalLimitValidation {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxAllowed?: number;
  remainingSlots?: number;
}

// Upgrade Prompt Tracking
export interface UpgradePrompt {
  id: string;
  userId: string;
  promptType: string;
  context: string;
  shownAt: Date;
  clicked: boolean;
}
