"use client";

import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  writeBatch,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { User, onAuthStateChanged } from "firebase/auth";
import "./Dashboard.css";

// Import Chart.js components

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title, // Import Title for chart
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Enhanced Dashboard Components
import { DashboardHeader } from "./DashboardHeader";
import { GoalProgressCard } from "./GoalProgressCard";
import { GoalDetailsModal } from "./GoalDetailsModal";
import { ProgressUpdateModal } from "./ProgressUpdateModal";
import { CategoryProgressSummary } from "./CategoryProgressSummary";
import { InsightsPanel } from "./InsightsPanel";
import SafeEmailVerificationBanner from "./SafeEmailVerificationBanner";
import { useGoalProgress } from "../hooks/useGoalProgress";
import {
  CoachingNote,
  GoalProgress,
  SmartGoal as DashboardSmartGoal,
  MeasurableData as DashboardMeasurableData,
} from "../types/Dashboard";

interface Goal {
  name: string;
  description: string;
  dueDate?: string;
  completed: boolean;
}

interface Checkin {
  id: string;
  circle: string;
  message: string;
  createdAt: { toDate?: () => Date };
  goal?: Goal;
  category: string;
}

// Use types from Dashboard.ts
type MeasurableData = DashboardMeasurableData;
type SmartGoal = DashboardSmartGoal;

// New interface for earned badges
interface UserBadge {
  id: string; // Unique ID for the earned badge instance
  badgeId: string; // e.g., "consistencyChampion", "milestoneMaster", "sharingEnthusiast"
  displayName: string;
  description: string;
  earnedAt: Timestamp;
  iconClass?: string; // Font Awesome class for MVP display
  count?: number; // For streak length or engagement counts associated with the badge
  goalId?: string; // If badge is related to a specific goal
}

// Type for the data part of the goal, excluding the ID
type SmartGoalData = Omit<SmartGoal, "id">;

// Helper function to get badge-specific CSS class for the icon background
const getBadgeIconBgClass = (badgeId: string): string => {
  if (badgeId.startsWith("consistencyChampion"))
    return "consistencyChampion-icon-bg";
  if (badgeId.startsWith("milestoneMaster")) return "milestoneMaster-icon-bg";
  if (badgeId.startsWith("sharingEnthusiast"))
    return "sharingEnthusiast-icon-bg";
  return ""; // Default no specific background class
};

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [errorGoals, setErrorGoals] = useState<string | null>(null);
  const [loadingCheckins, setLoadingCheckins] = useState(true);
  const [errorCheckins, setErrorCheckins] = useState<string | null>(null);
  const [goalUpdateStatus, setGoalUpdateStatus] = useState<{
    [key: string]: string;
  }>({});
  const [sharePrompt, setSharePrompt] = useState<{
    goalId: string;
    description: string;
  } | null>(null);

  // Modal state
  const [selectedGoal, setSelectedGoal] = useState<SmartGoal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [declineCoachStatus, setDeclineCoachStatus] = useState<{
    [key: string]: string;
  }>({});
  const [streakCount, setStreakCount] = useState<number>(0);
  const [progressUpdateStatus, setProgressUpdateStatus] = useState<{
    [key: string]: string;
  }>({});
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [overallProgress, setOverallProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  }>({ completed: 0, total: 0, percentage: 0 });

  // Enhanced Dashboard State
  const [coachingNotes, setCoachingNotes] = useState<CoachingNote[]>([]);

  // Enhanced Progress Hook
  const {
    categoryProgress: enhancedCategoryProgress,
    overallProgress: enhancedOverallProgress,
    insights,
    motivationalMessage,
    goalProgressMap,
    loading: progressLoading,
    error: progressError,
  } = useGoalProgress(smartGoals, coachingNotes);

  const navigate = useNavigate();

  // Add category filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setLoadingCheckins(false);
        setErrorCheckins("Please log in to view your dashboard.");
        setStreakCount(0);
      }
    });

    if (!currentUser) {
      if (loadingCheckins && !currentUser) setLoadingCheckins(false);
      return;
    }

    const user = currentUser;

    const fetchCheckins = async () => {
      console.log("Fetching checkins (if applicable)...");
      setLoadingCheckins(true);
      setErrorCheckins(null);
      const ref = collection(db, "users", user.uid, "checkins");
      const q = query(ref, orderBy("createdAt", "desc"));
      try {
        const snap = await getDocs(q);
        const results: Checkin[] = [];
        for (const docSnap of snap.docs) {
          const base = docSnap.data();
          const goalRef = collection(docSnap.ref, "goal");
          const goalSnap = await getDocs(goalRef);
          let goalData: Goal | undefined = undefined;
          if (!goalSnap.empty) {
            goalData = goalSnap.docs[0].data() as Goal;
          }
          results.push({
            id: docSnap.id,
            circle: base.circle,
            message: base.message,
            createdAt: base.createdAt,
            goal: goalData,
            category: base.category,
          });
        }
        setCheckins(results);
        setLoadingCheckins(false);
      } catch (err) {
        console.error("Error fetching checkins:", err);
        setErrorCheckins("Failed to load check-ins.");
        setLoadingCheckins(false);
      }
    };
    fetchCheckins();

    setLoadingGoals(true);
    setErrorGoals(null);
    const goalsCollectionRef = collection(db, `users/${user.uid}/goals`);
    const goalsQuery = query(goalsCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribeGoals: Unsubscribe = onSnapshot(
      goalsQuery,
      (querySnapshot) => {
        const fetchedGoals: SmartGoal[] = [];
        querySnapshot.forEach((doc) => {
          const goalData = doc.data() as SmartGoalData;
          fetchedGoals.push({ ...goalData, id: doc.id });
        });
        setSmartGoals(fetchedGoals);
        setLoadingGoals(false);
        checkAndAwardBadges();
      },
      (error) => {
        console.error("Error fetching SMART goals:", error);
        setErrorGoals("Failed to load goals. Please try again later.");
        setLoadingGoals(false);
      }
    );

    return () => {
      unsubscribeGoals();
    };
  }, [currentUser]);

  // Overall progress calculation
  useEffect(() => {
    if (smartGoals.length > 0) {
      let totalCompleted = 0;
      let totalGoals = smartGoals.length;

      smartGoals.forEach((goal) => {
        // Check if goal is completed or has high progress
        let isCompleted = goal.completed;
        if (!isCompleted && goal.measurable) {
          const progress = calculateGoalProgress(goal.measurable);
          isCompleted = progress >= 100;
        }

        if (isCompleted) {
          totalCompleted++;
        }
      });

      setOverallProgress({
        completed: totalCompleted,
        total: totalGoals,
        percentage:
          totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0,
      });
    } else {
      setOverallProgress({ completed: 0, total: 0, percentage: 0 });
    }
  }, [smartGoals]);

  // Helper function to calculate goal progress percentage
  const calculateGoalProgress = (measurable: MeasurableData): number => {
    if (!measurable) return 0;

    const { type, currentValue, targetValue } = measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak":
        if (
          typeof currentValue === "number" &&
          typeof targetValue === "number" &&
          targetValue > 0
        ) {
          return Math.min(Math.round((currentValue / targetValue) * 100), 100);
        }
        return 0;
      case "Boolean":
        return currentValue === true ? 100 : 0;
      case "Date":
        if (targetValue) {
          const targetDate = new Date((targetValue as string) + "T00:00:00");
          const today = new Date();
          const createdDate = new Date(); // You might want to use goal.createdAt here

          if (today >= targetDate) return 100;

          const totalDays = Math.ceil(
            (targetDate.getTime() - createdDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const daysPassed = Math.ceil(
            (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return Math.max(
            0,
            Math.min(Math.round((daysPassed / totalDays) * 100), 100)
          );
        }
        return 0;
      default:
        return 0;
    }
  };

  const handleMarkAsComplete = async (goalId: string, description: string) => {
    if (!currentUser) {
      setGoalUpdateStatus({
        ...goalUpdateStatus,
        [goalId]: "Error: Not logged in",
      });
      return;
    }
    setGoalUpdateStatus({ ...goalUpdateStatus, [goalId]: "Updating..." });
    const goalRef = doc(db, `users/${currentUser.uid}/goals`, goalId);
    try {
      await updateDoc(goalRef, {
        completed: true,
        status: "completed",
        coachUid: null,
        coachName: null,
        coachStatus: "declined_by_user",
      });
      setSmartGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                coachUid: undefined,
                coachName: undefined,
                coachStatus: undefined,
              }
            : g
        )
      );
      setDeclineCoachStatus((prev) => ({
        ...prev,
        [goalId]: "Coach removed.",
      }));
      setGoalUpdateStatus({ ...goalUpdateStatus, [goalId]: "Completed!" });
      setSharePrompt({ goalId, description });
    } catch (error) {
      console.error("Error updating goal status:", error);
      setGoalUpdateStatus({ ...goalUpdateStatus, [goalId]: "Error updating" });
    }
  };

  // Enhanced modal handlers
  const handleViewDetails = (goal: SmartGoal) => {
    const progress = goalProgressMap.get(goal.id) || {
      goalId: goal.id,
      percentage: calculateGoalProgress(goal.measurable),
      status: goal.completed
        ? ("completed" as const)
        : ("in-progress" as const),
      lastUpdated: new Date(),
      hasUnreadCoachNotes: false,
      coachingNotes: coachingNotes.filter((note) => note.goalId === goal.id),
    };

    setSelectedGoal(goal);
    setGoalProgress(progress);
    setShowDetailsModal(true);
  };

  const handleShowProgressModal = (goal: SmartGoal) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  const handleEnhancedProgressUpdate = (
    goalId: string,
    newValue: number | string | boolean
  ) => {
    const goal = smartGoals.find((g) => g.id === goalId);
    if (!goal) return;

    // Update the goal with the new value
    const updatedGoal = {
      ...goal,
      measurable: {
        ...goal.measurable,
        currentValue: newValue,
      },
    };

    // Call the original update function
    handleUpdateProgress(updatedGoal);
  };

  const handleGoalUpdate = (updatedGoal: SmartGoal) => {
    // Update the goal in the local state
    setSmartGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  const handleUpdateProgress = async (goal: SmartGoal) => {
    if (!currentUser || !goal.measurable) {
      setProgressUpdateStatus({
        ...progressUpdateStatus,
        [goal.id]: "Error: Missing data",
      });
      return;
    }

    setProgressUpdateStatus({
      ...progressUpdateStatus,
      [goal.id]: "Updating...",
    });

    const { type, currentValue, targetValue } = goal.measurable;
    let newCurrentValue: number | string | boolean | null = currentValue;
    let shouldUpdate = true;

    switch (type) {
      case "Numeric":
        newCurrentValue =
          (typeof currentValue === "number" ? currentValue : 0) + 1;
        // Optional: Cap at targetValue if needed, e.g. Math.min(newCurrentValue, targetValue as number)
        break;
      case "DailyStreak":
        newCurrentValue =
          (typeof currentValue === "number" ? currentValue : 0) + 1;
        break;
      case "Boolean":
        if (currentValue === false) {
          newCurrentValue = true;
        } else {
          shouldUpdate = false; // Already true, no update needed via this button
          setProgressUpdateStatus({
            ...progressUpdateStatus,
            [goal.id]: "Already done",
          });
        }
        break;
      case "Date":
        // For now, no direct increment via this button for Date type
        shouldUpdate = false;
        setProgressUpdateStatus({
          ...progressUpdateStatus,
          [goal.id]: "No action for Date type",
        });
        break;
      default:
        shouldUpdate = false;
        setProgressUpdateStatus({
          ...progressUpdateStatus,
          [goal.id]: "Unknown type",
        });
        console.warn("Unknown measurable type for progress update:", type);
        return;
    }

    if (!shouldUpdate) return;

    const goalRef = doc(db, `users/${currentUser.uid}/goals`, goal.id);
    const todayDateString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dailyActivityRef = doc(
      db,
      `users/${currentUser.uid}/dailyActivity`,
      todayDateString
    );

    try {
      // Batch updates: goal progress and daily activity log
      const batch = writeBatch(db);
      batch.update(goalRef, {
        "measurable.currentValue": newCurrentValue,
        lastProgressUpdateAt: serverTimestamp(),
      });
      batch.set(
        dailyActivityRef,
        { lastCheckIn: serverTimestamp(), checkedInToday: true },
        { merge: true }
      );
      await batch.commit();

      // Update local state for immediate UI feedback
      setSmartGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                measurable: { ...g.measurable, currentValue: newCurrentValue },
                lastProgressUpdateAt: Timestamp.now(), // Reflect in local state immediately
              }
            : g
        )
      );
      setProgressUpdateStatus({
        ...progressUpdateStatus,
        [goal.id]: "Progress Updated!",
      });
      // Recalculate streak after successful update
      // This will be handled by the useEffect that depends on smartGoals
      setTimeout(
        () => setProgressUpdateStatus((prev) => ({ ...prev, [goal.id]: "" })),
        2000
      ); // Clear status after 2s
      checkAndAwardBadges();
    } catch (error) {
      console.error("Error updating goal progress:", error);
      setProgressUpdateStatus({
        ...progressUpdateStatus,
        [goal.id]: "Error updating",
      });
    }
  };

  const handleShareForCoaching = (goalId: string, description: string) => {
    // Implementation of handleShareForCoaching function
  };

  const handleShareMilestone = (goal: SmartGoal) => {
    if (!goal.measurable) {
      // Navigate with a generic message if measurable data is not available
      const shareText = `I'm working on my goal: "${goal.description}"! #GoalMomentum #Productivity`;
      navigate(
        `/share-goal?goalId=${goal.id}&text=${encodeURIComponent(shareText)}`
      );
      return;
    }

    const { description, measurable } = goal;
    let progressText = "";
    const { type, currentValue, targetValue, unit } = measurable;

    switch (type) {
      case "Numeric":
        progressText = `Current progress: ${currentValue ?? 0}/${
          targetValue ?? "N/A"
        } ${unit || ""}`;
        break;
      case "DailyStreak":
        progressText = `Current streak: ${currentValue ?? 0}/${
          targetValue ?? "N/A"
        } days`;
        break;
      case "Boolean":
        progressText = currentValue
          ? "Completed this step!"
          : "Still in progress.";
        break;
      case "Date":
        progressText = `Target date for this milestone: ${
          targetValue
            ? new Date(
                (targetValue as string) + "T00:00:00"
              ).toLocaleDateString()
            : "Not set"
        }`;
        break;
      default:
        progressText = "Making progress!";
    }

    const shareText = `Milestone Update! For my goal "${description}": ${progressText} Let's go! 💪 #GoalMomentum #Progress`;
    navigate(
      `/share-goal?goalId=${goal.id}&text=${encodeURIComponent(shareText)}`
    );
  };

  const handleDeclineCoach = (goalId: string) => {
    // Implementation of handleDeclineCoach function
  };

  // Handle category click to filter goals
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    // Scroll to goals section
    const goalsSection = document.getElementById("smart-goals");
    if (goalsSection) {
      goalsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Function to check and award badges
  const checkAndAwardBadges = async () => {
    if (!currentUser || !initialDataLoaded) return;
    console.log("Checking for badges to award...");

    // --- Consistency Champion (7-day check-in streak) ---
    const consistencyBadgeId = "consistencyChampion";
    // Check against local earnedBadges state first for quick check
    const alreadyHasConsistencyBadge = earnedBadges.some(
      (b) => b.badgeId === consistencyBadgeId
    );

    if (!alreadyHasConsistencyBadge) {
      console.log("Checking for Consistency Champion badge...");
      let consecutiveDays = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        const activityDocRef = doc(
          db,
          `users/${currentUser.uid}/dailyActivity`,
          dateString
        );
        const activitySnap = await getDoc(activityDocRef);
        if (activitySnap.exists() && activitySnap.data().checkedInToday) {
          consecutiveDays++;
        } else {
          console.log(`Streak broken at day ${i + 1} (date: ${dateString})`);
          break;
        }
      }
      console.log("Consecutive check-in days:", consecutiveDays);

      if (consecutiveDays >= 7) {
        const badgeData: Omit<UserBadge, "id"> = {
          badgeId: consistencyBadgeId,
          displayName: "Consistency Champion",
          description: "Checked-in 7 days in a row!",
          earnedAt: serverTimestamp() as Timestamp,
          iconClass: "fas fa-shield-alt",
          count: 7,
        };
        try {
          // Use badgeId as document ID for uniqueness per user per badge type
          const badgeDocRef = doc(
            db,
            `users/${currentUser.uid}/badges`,
            consistencyBadgeId
          );
          await setDoc(badgeDocRef, badgeData);
          console.log("Consistency Champion badge awarded and saved!");
        } catch (error) {
          console.error("Error awarding Consistency Champion badge:", error);
        }
      }
    }
    // --- End Consistency Champion ---

    // --- Milestone Master (50% on a SMART goal) ---
    console.log("Checking for Milestone Master badges...");
    for (const goal of smartGoals) {
      if (
        goal.measurable &&
        (goal.measurable.type === "Numeric" ||
          goal.measurable.type === "DailyStreak")
      ) {
        const { currentValue, targetValue } = goal.measurable;
        if (
          typeof currentValue === "number" &&
          typeof targetValue === "number" &&
          targetValue > 0
        ) {
          const progress = currentValue / targetValue;
          if (progress >= 0.5) {
            const milestoneBadgeId = `milestoneMaster_${goal.id}_50percent`;
            const alreadyHasMilestoneBadge = earnedBadges.some(
              (b) => b.badgeId === milestoneBadgeId
            );

            if (!alreadyHasMilestoneBadge) {
              console.log(
                `Awarding Milestone Master for 50% on goal: ${goal.description}`
              );
              const badgeData: Omit<UserBadge, "id"> = {
                badgeId: milestoneBadgeId,
                displayName: "Milestone Master (50%)",
                description: `Reached 50% on your goal: "${goal.description}"!`,
                earnedAt: serverTimestamp() as Timestamp,
                iconClass: "fas fa-star", // Example icon for Milestone Master
                goalId: goal.id,
                count: 50, // Representing 50%
              };
              try {
                // Use the unique milestoneBadgeId as the document ID
                const badgeDocRef = doc(
                  db,
                  `users/${currentUser.uid}/badges`,
                  milestoneBadgeId
                );
                await setDoc(badgeDocRef, badgeData);
                console.log(
                  `Milestone Master badge for goal ${goal.id} (50%) awarded and saved!`
                );
              } catch (error) {
                console.error("Error awarding Milestone Master badge:", error);
              }
            }
          }
        }
      }
    }
    // --- End Milestone Master ---

    // --- Sharing Enthusiast (Share 3 times) ---
    console.log("Checking for Sharing Enthusiast badge...");
    const sharingBadgeId = "sharingEnthusiast";
    const alreadyHasSharingBadge = earnedBadges.some(
      (b) => b.badgeId === sharingBadgeId
    );

    if (!alreadyHasSharingBadge) {
      const userStatsRef = doc(
        db,
        `users/${currentUser.uid}/userStats`,
        "sharing"
      );
      try {
        const statsSnap = await getDoc(userStatsRef);
        if (statsSnap.exists()) {
          const shareData = statsSnap.data();
          const shareCount = shareData.count || 0;
          console.log("User share count:", shareCount);
          if (shareCount >= 3) {
            console.log("Awarding Sharing Enthusiast badge...");
            const badgeData: Omit<UserBadge, "id"> = {
              badgeId: sharingBadgeId,
              displayName: "Sharing Enthusiast",
              description: "Shared your progress or goals 3 times!",
              earnedAt: serverTimestamp() as Timestamp,
              iconClass: "fas fa-bullhorn", // Example icon for sharing
              count: shareCount, // Store the current share count when badge is earned
            };
            const badgeDocRef = doc(
              db,
              `users/${currentUser.uid}/badges`,
              sharingBadgeId
            );
            await setDoc(badgeDocRef, badgeData);
            console.log("Sharing Enthusiast badge awarded and saved!");
          }
        } else {
          console.log("No sharing stats found for user.");
        }
      } catch (error) {
        console.error(
          "Error checking or awarding Sharing Enthusiast badge:",
          error
        );
      }
    }
    // --- End Sharing Enthusiast ---
  };

  // useEffect for fetching earned badges
  useEffect(() => {
    if (!currentUser) {
      setEarnedBadges([]);
      setLoadingBadges(false);
      return;
    }
    setLoadingBadges(true);
    const badgesCollectionRef = collection(
      db,
      `users/${currentUser.uid}/badges`
    );
    const unsubscribeBadges = onSnapshot(
      badgesCollectionRef,
      (snapshot) => {
        const newBadges: UserBadge[] = [];
        snapshot.forEach((doc) =>
          newBadges.push({ ...doc.data(), id: doc.id } as UserBadge)
        );
        setEarnedBadges(newBadges);
        setLoadingBadges(false);
      },
      (error) => {
        console.error("Error fetching badges:", error);
        setLoadingBadges(false);
      }
    );
    return () => unsubscribeBadges();
  }, [currentUser]);

  // useEffect for initial data load check and subsequent badge checks
  useEffect(() => {
    if (!loadingGoals && !loadingBadges && currentUser) {
      setInitialDataLoaded(true);
    }
  }, [loadingGoals, loadingBadges, currentUser]);

  useEffect(() => {
    if (initialDataLoaded) {
      checkAndAwardBadges();
    }
  }, [initialDataLoaded, smartGoals, earnedBadges]); // Re-check if goals or badges change after initial load

  return (
    <div className="dashboard-container space-y-6">
      {/* Phase 3: Enhanced Dashboard Header */}
      <DashboardHeader
        overallProgress={enhancedOverallProgress}
        insights={insights}
      />

      {/* Email Verification Banner */}
      <SafeEmailVerificationBanner />

      {/* Phase 3: Category Progress Overview */}
      <CategoryProgressSummary
        categoryProgress={enhancedCategoryProgress}
        onCategoryClick={handleCategoryClick}
      />

      {/* Phase 5: Smart Insights Panel */}
      <InsightsPanel insights={insights} />

      <section id="smart-goals" className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            Your SMART Goals
            {selectedCategory && (
              <span className="filter-indicator">- {selectedCategory}</span>
            )}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="clear-filter-btn"
              aria-label="Clear category filter"
            >
              ✕ Show All Goals
            </button>
          )}
        </div>

        {sharePrompt && (
          <div className="p-3 mb-4 text-center bg-green-100 border border-green-300 rounded-md">
            <p className="font-medium">
              🎉 Goal "{sharePrompt.description}" marked as complete!
            </p>
            <Link
              to={`/share-goal?milestone=goalComplete&goalId=${
                sharePrompt.goalId
              }&text=${encodeURIComponent(
                `🏆 Achievement Unlocked! 🏆\nI just achieved my goal: "${sharePrompt.description}"! #GoalPulse #AchievementUnlocked #Productivity`
              )}`}
              className="inline-block mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={() => setSharePrompt(null)}
            >
              Share Your Achievement!
            </Link>
          </div>
        )}

        {loadingGoals && <p>Loading your SMART goals...</p>}
        {errorGoals && (
          <p className="error-message">
            Error loading SMART goals: {errorGoals}
          </p>
        )}
        {!loadingGoals && smartGoals.length === 0 && (
          <p>No SMART goals found. Why not add one?</p>
        )}
        <div className="goals-grid">
          {smartGoals
            .filter(
              (goal) =>
                !selectedCategory ||
                (goal.category || "Uncategorized") === selectedCategory
            )
            .map((goal) => {
              const goalCoachingNotes = coachingNotes.filter(
                (note) => note.goalId === goal.id
              );
              const goalProgress = goalProgressMap.get(goal.id) || {
                goalId: goal.id,
                percentage: calculateGoalProgress(goal.measurable),
                status: goal.completed
                  ? ("completed" as const)
                  : ("in-progress" as const),
                lastUpdated: new Date(),
                hasUnreadCoachNotes: goalCoachingNotes.some(
                  (note) => !note.isRead
                ),
                coachingNotes: goalCoachingNotes,
              };

              return (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  progress={goalProgress}
                  onUpdateProgress={() => handleShowProgressModal(goal)}
                  onMarkComplete={() =>
                    handleMarkAsComplete(goal.id, goal.description)
                  }
                  onViewDetails={() => handleViewDetails(goal)}
                />
              );
            })}
        </div>

        {/* Quick Add Goal Button */}
        <div className="quick-add-goal-button-container mt-8 text-center">
          <button
            onClick={() => navigate("/add-goal")}
            className="quick-add-goal-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out text-base"
          >
            🚀 Add New SMART Goal
          </button>
        </div>
      </section>

      {/* Achievements/Badges Section */}
      <section id="achievements" className="dashboard-section">
        <h2 className="section-title">Your Achievements</h2>
        {loadingBadges && <p>Loading your badges...</p>}
        {!loadingBadges && earnedBadges.length === 0 && (
          <p>No badges earned yet. Keep making progress on your goals!</p>
        )}
        {!loadingBadges && earnedBadges.length > 0 && (
          <div className="badges-grid">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="badge-card">
                <div
                  className={`badge-icon ${getBadgeIconBgClass(badge.badgeId)}`}
                >
                  {badge.iconClass && <i className={badge.iconClass}></i>}
                  {!badge.iconClass && <i className="fas fa-medal"></i>}
                </div>
                <div className="badge-info">
                  <h4 className="badge-name">{badge.displayName}</h4>
                  <p className="badge-description">{badge.description}</p>
                  {badge.count && (
                    <p className="badge-count">Level: {badge.count}</p>
                  )}
                  <p className="badge-earned-date">
                    Earned: {badge.earnedAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Enhanced Modals */}
      {selectedGoal && goalProgress && (
        <GoalDetailsModal
          goal={selectedGoal}
          progress={goalProgress}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onGoalUpdate={handleGoalUpdate}
        />
      )}

      {selectedGoal && (
        <ProgressUpdateModal
          goal={selectedGoal}
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          onUpdate={handleEnhancedProgressUpdate}
        />
      )}
    </div>
  );
}

// Helper function to display measurable data
const formatMeasurableData = (measurable: MeasurableData): string => {
  if (!measurable || !measurable.type) return "Not provided";

  switch (measurable.type) {
    case "Numeric":
      return `${measurable.targetValue || "N/A"} ${
        measurable.unit || ""
      } (current: ${measurable.currentValue ?? "N/A"})`;
    case "Date":
      return `Target Date: ${
        measurable.targetValue
          ? new Date(
              (measurable.targetValue as string) + "T00:00:00"
            ).toLocaleDateString()
          : "N/A"
      }`;
    case "DailyStreak":
      return `Target: ${
        measurable.targetValue || "N/A"
      } days streak (current: ${measurable.currentValue ?? "N/A"} days)`;
    case "Boolean":
      return measurable.currentValue ? "Completed" : "Not Completed";
    default:
      return "Invalid measurable data";
  }
};
