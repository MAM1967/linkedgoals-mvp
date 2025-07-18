import { PlanType, PlanLimits, GoalLimitValidation } from "../types";

// Plan Configuration Constants
export const PLAN_CONFIG = {
  free: {
    maxGoals: 3,
    features: ["basic_goal_tracking", "dashboard_access", "basic_sharing"],
    analyticsAccess: false,
    collaborationAccess: false,
    prioritySupport: false,
  },
  premium: {
    maxGoals: -1, // -1 means unlimited
    features: [
      "unlimited_goals",
      "advanced_analytics",
      "custom_categories",
      "collaboration",
      "priority_support",
      "data_export",
    ],
    analyticsAccess: true,
    collaborationAccess: true,
    prioritySupport: true,
  },
  trial: {
    maxGoals: -1, // Unlimited during trial
    features: [
      "unlimited_goals",
      "advanced_analytics",
      "custom_categories",
      "collaboration",
      "priority_support",
      "data_export",
    ],
    analyticsAccess: true,
    collaborationAccess: true,
    prioritySupport: true,
  },
};

// Get plan limits for a specific plan type
export function getPlanLimits(planType: PlanType): PlanLimits {
  const config = PLAN_CONFIG[planType];
  return {
    maxGoals: config.maxGoals,
    features: config.features,
    analyticsAccess: config.analyticsAccess,
    collaborationAccess: config.collaborationAccess,
    prioritySupport: config.prioritySupport,
  };
}

// Check if user can create a new goal
export function canCreateNewGoal(
  planType: PlanType,
  currentGoalCount: number
): GoalLimitValidation {
  const planLimits = getPlanLimits(planType);
  const maxGoals = planLimits.maxGoals;

  // Premium and trial users have unlimited goals
  if (maxGoals === -1) {
    return {
      allowed: true,
      currentCount: currentGoalCount,
      maxAllowed: -1,
      remainingSlots: -1,
    };
  }

  // Free users are limited
  if (currentGoalCount >= maxGoals) {
    return {
      allowed: false,
      reason: `Free tier limited to ${maxGoals} goals`,
      currentCount: currentGoalCount,
      maxAllowed: maxGoals,
      remainingSlots: 0,
    };
  }

  return {
    allowed: true,
    currentCount: currentGoalCount,
    maxAllowed: maxGoals,
    remainingSlots: maxGoals - currentGoalCount,
  };
}

// Check if user has access to a specific feature
export function hasFeatureAccess(planType: PlanType, feature: string): boolean {
  const planLimits = getPlanLimits(planType);
  return planLimits.features.includes(feature);
}

// Get upgrade messaging based on current usage
export function getUpgradeMessage(
  planType: PlanType,
  currentGoalCount: number
): string {
  if (planType !== "free") {
    return "";
  }

  const remaining = 3 - currentGoalCount;

  if (remaining === 0) {
    return "You've reached your 3-goal limit! Upgrade to Premium for unlimited goals.";
  } else if (remaining === 1) {
    return "1 more goal slot available. Upgrade to Premium for unlimited goals.";
  } else {
    return `${remaining} goal slots remaining. Upgrade to Premium for unlimited goals.`;
  }
}

// Check if user should see upgrade prompt
export function shouldShowUpgradePrompt(
  planType: PlanType,
  currentGoalCount: number
): boolean {
  if (planType !== "free") {
    return false;
  }

  // Show upgrade prompt when user has 2 or more goals
  return currentGoalCount >= 2;
}
