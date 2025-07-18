import { renderHook, waitFor, act } from "@testing-library/react";
import { usePlanLimits } from "../usePlanLimits";
import { useAuth } from "../useAuth";
import { getCachedGoalCount, clearGoalCountCache } from "../../utils/goalCount";

// Mock dependencies
jest.mock("../useAuth");
jest.mock("../../utils/goalCount");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetCachedGoalCount = getCachedGoalCount as jest.MockedFunction<
  typeof getCachedGoalCount
>;
const mockClearGoalCountCache = clearGoalCountCache as jest.MockedFunction<
  typeof clearGoalCountCache
>;

describe("usePlanLimits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: "test-user-id" },
      loading: false,
    } as ReturnType<typeof useAuth>);
    mockGetCachedGoalCount.mockResolvedValue(2);
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => usePlanLimits());

    expect(result.current.goalCount).toBe(0);
    expect(result.current.planType).toBe("free");
    expect(result.current.loading).toBe(true);
  });

  it("fetches user data on mount", async () => {
    const { result } = renderHook(() => usePlanLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetCachedGoalCount).toHaveBeenCalledWith("test-user-id");
    expect(result.current.goalCount).toBe(2);
    expect(result.current.planType).toBe("free");
  });

  it("handles no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => usePlanLimits());

    expect(result.current.loading).toBe(false);
    expect(result.current.goalCount).toBe(0);
    expect(result.current.planType).toBe("free");
  });

  it("handles errors gracefully", async () => {
    mockGetCachedGoalCount.mockRejectedValue(new Error("Database error"));

    const { result } = renderHook(() => usePlanLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goalCount).toBe(0);
    expect(result.current.planType).toBe("free");
  });

  describe("canCreateGoal", () => {
    it("returns correct validation for free user under limit", async () => {
      mockGetCachedGoalCount.mockResolvedValue(1);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.canCreateGoal();
      expect(validation.allowed).toBe(true);
      expect(validation.currentCount).toBe(1);
      expect(validation.maxAllowed).toBe(3);
      expect(validation.remainingSlots).toBe(2);
    });

    it("returns correct validation for free user at limit", async () => {
      mockGetCachedGoalCount.mockResolvedValue(3);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.canCreateGoal();
      expect(validation.allowed).toBe(false);
      expect(validation.currentCount).toBe(3);
      expect(validation.maxAllowed).toBe(3);
      expect(validation.remainingSlots).toBe(0);
      expect(validation.reason).toBe("Free tier limited to 3 goals");
    });

    it("returns correct validation for free user over limit", async () => {
      mockGetCachedGoalCount.mockResolvedValue(5);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validation = result.current.canCreateGoal();
      expect(validation.allowed).toBe(false);
      expect(validation.currentCount).toBe(5);
      expect(validation.maxAllowed).toBe(3);
      expect(validation.remainingSlots).toBe(0);
    });
  });

  describe("showUpgradePrompt", () => {
    it("returns false for users with 0 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(0);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.showUpgradePrompt()).toBe(false);
    });

    it("returns false for users with 1 goal", async () => {
      mockGetCachedGoalCount.mockResolvedValue(1);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.showUpgradePrompt()).toBe(false);
    });

    it("returns true for users with 2 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.showUpgradePrompt()).toBe(true);
    });

    it("returns true for users with 3 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(3);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.showUpgradePrompt()).toBe(true);
    });
  });

  describe("upgradeMessage", () => {
    it("returns correct message for users with 0 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(0);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.upgradeMessage()).toBe(
        "3 goal slots remaining. Upgrade to Premium for unlimited goals."
      );
    });

    it("returns correct message for users with 2 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.upgradeMessage()).toBe(
        "1 more goal slot available. Upgrade to Premium for unlimited goals."
      );
    });

    it("returns correct message for users with 3 goals", async () => {
      mockGetCachedGoalCount.mockResolvedValue(3);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.upgradeMessage()).toBe(
        "You've reached your 3-goal limit! Upgrade to Premium for unlimited goals."
      );
    });
  });

  describe("refreshGoalCount", () => {
    it("refreshes goal count", async () => {
      mockGetCachedGoalCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockGetCachedGoalCount.mockResolvedValue(4);
      await act(async () => {
        await result.current.refreshGoalCount();
      });

      expect(mockClearGoalCountCache).toHaveBeenCalledWith("test-user-id");
      expect(result.current.goalCount).toBe(4);
    });

    it("handles refresh with no user", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePlanLimits());

      await result.current.refreshGoalCount();

      expect(mockClearGoalCountCache).not.toHaveBeenCalled();
    });
  });

  describe("incrementGoalCount", () => {
    it("increments goal count", async () => {
      mockGetCachedGoalCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.incrementGoalCount();
      });

      expect(result.current.goalCount).toBe(3);
    });
  });

  describe("decrementGoalCount", () => {
    it("decrements goal count", async () => {
      mockGetCachedGoalCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.decrementGoalCount();
      });

      expect(result.current.goalCount).toBe(1);
    });

    it("does not go below 0", async () => {
      mockGetCachedGoalCount.mockResolvedValue(0);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.decrementGoalCount();

      expect(result.current.goalCount).toBe(0);
    });
  });
});
