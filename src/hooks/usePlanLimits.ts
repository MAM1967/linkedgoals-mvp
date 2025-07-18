import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { PlanType, GoalLimitValidation } from "../types";
import {
  canCreateNewGoal,
  shouldShowUpgradePrompt,
  getUpgradeMessage,
} from "../utils/planLimits";
import { getCachedGoalCount, clearGoalCountCache } from "../utils/goalCount";

export function usePlanLimits() {
  const { user } = useAuth();
  const [goalCount, setGoalCount] = useState<number>(0);
  const [planType, setPlanType] = useState<PlanType>("free");
  const [loading, setLoading] = useState<boolean>(true);

  // Get user's plan type and goal count
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // For now, default to free plan (we'll implement plan detection later)
        setPlanType("free");

        // Get cached goal count
        const count = await getCachedGoalCount(user.uid);
        setGoalCount(count);
      } catch (error) {
        console.error("Error fetching user plan data:", error);
        setGoalCount(0);
        setPlanType("free");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.uid]);

  // Check if user can create a new goal
  const canCreateGoal = (): GoalLimitValidation => {
    return canCreateNewGoal(planType, goalCount);
  };

  // Check if upgrade prompt should be shown
  const showUpgradePrompt = (): boolean => {
    return shouldShowUpgradePrompt(planType, goalCount);
  };

  // Get upgrade message
  const upgradeMessage = (): string => {
    return getUpgradeMessage(planType, goalCount);
  };

  // Refresh goal count (call when goals are created/deleted)
  const refreshGoalCount = async () => {
    if (!user?.uid) return;

    clearGoalCountCache(user.uid);
    const count = await getCachedGoalCount(user.uid);
    setGoalCount(count);
  };

  // Increment goal count (when creating new goal)
  const incrementGoalCount = () => {
    setGoalCount((prev) => prev + 1);
  };

  // Decrement goal count (when deleting goal)
  const decrementGoalCount = () => {
    setGoalCount((prev) => Math.max(0, prev - 1));
  };

  return {
    goalCount,
    planType,
    loading,
    canCreateGoal,
    showUpgradePrompt,
    upgradeMessage,
    refreshGoalCount,
    incrementGoalCount,
    decrementGoalCount,
  };
}
