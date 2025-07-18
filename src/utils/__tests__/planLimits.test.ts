import {
  getPlanLimits,
  canCreateNewGoal,
  hasFeatureAccess,
  getUpgradeMessage,
  shouldShowUpgradePrompt,
  PLAN_CONFIG,
} from "../planLimits";

describe("planLimits", () => {
  describe("PLAN_CONFIG", () => {
    it("should have correct free plan configuration", () => {
      expect(PLAN_CONFIG.free).toEqual({
        maxGoals: 3,
        features: ["basic_goal_tracking", "dashboard_access", "basic_sharing"],
        analyticsAccess: false,
        collaborationAccess: false,
        prioritySupport: false,
      });
    });

    it("should have correct premium plan configuration", () => {
      expect(PLAN_CONFIG.premium).toEqual({
        maxGoals: -1, // unlimited
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
      });
    });

    it("should have correct trial plan configuration", () => {
      expect(PLAN_CONFIG.trial).toEqual({
        maxGoals: -1, // unlimited
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
      });
    });
  });

  describe("getPlanLimits", () => {
    it("should return correct limits for free plan", () => {
      const limits = getPlanLimits("free");
      expect(limits.maxGoals).toBe(3);
      expect(limits.features).toContain("basic_goal_tracking");
      expect(limits.analyticsAccess).toBe(false);
    });

    it("should return correct limits for premium plan", () => {
      const limits = getPlanLimits("premium");
      expect(limits.maxGoals).toBe(-1);
      expect(limits.features).toContain("unlimited_goals");
      expect(limits.analyticsAccess).toBe(true);
    });

    it("should return correct limits for trial plan", () => {
      const limits = getPlanLimits("trial");
      expect(limits.maxGoals).toBe(-1);
      expect(limits.features).toContain("unlimited_goals");
      expect(limits.analyticsAccess).toBe(true);
    });
  });

  describe("canCreateNewGoal", () => {
    describe("free plan", () => {
      it("should allow creating goals when under limit", () => {
        const result = canCreateNewGoal("free", 0);
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(0);
        expect(result.maxAllowed).toBe(3);
        expect(result.remainingSlots).toBe(3);
      });

      it("should allow creating goals when at limit", () => {
        const result = canCreateNewGoal("free", 3);
        expect(result.allowed).toBe(false);
        expect(result.currentCount).toBe(3);
        expect(result.maxAllowed).toBe(3);
        expect(result.remainingSlots).toBe(0);
        expect(result.reason).toBe("Free tier limited to 3 goals");
      });

      it("should not allow creating goals when over limit", () => {
        const result = canCreateNewGoal("free", 5);
        expect(result.allowed).toBe(false);
        expect(result.currentCount).toBe(5);
        expect(result.maxAllowed).toBe(3);
        expect(result.remainingSlots).toBe(0);
      });

      it("should show correct remaining slots", () => {
        const result = canCreateNewGoal("free", 1);
        expect(result.allowed).toBe(true);
        expect(result.remainingSlots).toBe(2);
      });
    });

    describe("premium plan", () => {
      it("should always allow creating goals", () => {
        const result = canCreateNewGoal("premium", 10);
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(10);
        expect(result.maxAllowed).toBe(-1);
        expect(result.remainingSlots).toBe(-1);
      });

      it("should allow creating goals even with 0 goals", () => {
        const result = canCreateNewGoal("premium", 0);
        expect(result.allowed).toBe(true);
        expect(result.remainingSlots).toBe(-1);
      });
    });

    describe("trial plan", () => {
      it("should always allow creating goals", () => {
        const result = canCreateNewGoal("trial", 15);
        expect(result.allowed).toBe(true);
        expect(result.currentCount).toBe(15);
        expect(result.maxAllowed).toBe(-1);
        expect(result.remainingSlots).toBe(-1);
      });
    });
  });

  describe("hasFeatureAccess", () => {
    it("should return true for features available in free plan", () => {
      expect(hasFeatureAccess("free", "basic_goal_tracking")).toBe(true);
      expect(hasFeatureAccess("free", "dashboard_access")).toBe(true);
      expect(hasFeatureAccess("free", "basic_sharing")).toBe(true);
    });

    it("should return false for premium features in free plan", () => {
      expect(hasFeatureAccess("free", "unlimited_goals")).toBe(false);
      expect(hasFeatureAccess("free", "advanced_analytics")).toBe(false);
      expect(hasFeatureAccess("free", "collaboration")).toBe(false);
    });

    it("should return true for all features in premium plan", () => {
      expect(hasFeatureAccess("premium", "unlimited_goals")).toBe(true);
      expect(hasFeatureAccess("premium", "advanced_analytics")).toBe(true);
      expect(hasFeatureAccess("premium", "collaboration")).toBe(true);
      expect(hasFeatureAccess("premium", "basic_goal_tracking")).toBe(false);
    });

    it("should return true for all features in trial plan", () => {
      expect(hasFeatureAccess("trial", "unlimited_goals")).toBe(true);
      expect(hasFeatureAccess("trial", "advanced_analytics")).toBe(true);
      expect(hasFeatureAccess("trial", "collaboration")).toBe(true);
    });

    it("should return false for non-existent features", () => {
      expect(hasFeatureAccess("free", "non_existent_feature")).toBe(false);
      expect(hasFeatureAccess("premium", "non_existent_feature")).toBe(false);
    });
  });

  describe("getUpgradeMessage", () => {
    it("should return empty string for premium users", () => {
      expect(getUpgradeMessage("premium", 5)).toBe("");
      expect(getUpgradeMessage("trial", 10)).toBe("");
    });

    it("should return correct message for free users with 0 goals", () => {
      expect(getUpgradeMessage("free", 0)).toBe(
        "3 goal slots remaining. Upgrade to Premium for unlimited goals."
      );
    });

    it("should return correct message for free users with 1 goal", () => {
      expect(getUpgradeMessage("free", 1)).toBe(
        "2 goal slots remaining. Upgrade to Premium for unlimited goals."
      );
    });

    it("should return correct message for free users with 2 goals", () => {
      expect(getUpgradeMessage("free", 2)).toBe(
        "1 more goal slot available. Upgrade to Premium for unlimited goals."
      );
    });

    it("should return correct message for free users with 3 goals", () => {
      expect(getUpgradeMessage("free", 3)).toBe(
        "You've reached your 3-goal limit! Upgrade to Premium for unlimited goals."
      );
    });

    it("should return correct message for free users over limit", () => {
      expect(getUpgradeMessage("free", 5)).toBe(
        "-2 goal slots remaining. Upgrade to Premium for unlimited goals."
      );
    });
  });

  describe("shouldShowUpgradePrompt", () => {
    it("should return false for premium users", () => {
      expect(shouldShowUpgradePrompt("premium", 10)).toBe(false);
      expect(shouldShowUpgradePrompt("trial", 15)).toBe(false);
    });

    it("should return false for free users with 0 goals", () => {
      expect(shouldShowUpgradePrompt("free", 0)).toBe(false);
    });

    it("should return false for free users with 1 goal", () => {
      expect(shouldShowUpgradePrompt("free", 1)).toBe(false);
    });

    it("should return true for free users with 2 goals", () => {
      expect(shouldShowUpgradePrompt("free", 2)).toBe(true);
    });

    it("should return true for free users with 3 goals", () => {
      expect(shouldShowUpgradePrompt("free", 3)).toBe(true);
    });

    it("should return true for free users over limit", () => {
      expect(shouldShowUpgradePrompt("free", 5)).toBe(true);
    });
  });
});
