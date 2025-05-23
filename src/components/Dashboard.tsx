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
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title, // Import Title for chart
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

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

// Define the new structure for the measurable field
interface MeasurableData {
  type: string; // e.g., "Numeric", "Date", "DailyStreak", "Boolean"
  targetValue: number | string | null;
  currentValue: number | string | boolean | null;
  unit?: string; // e.g., "pages", "days", "tasks" - for Numeric type
}

interface SmartGoal {
  id: string;
  description: string;
  specific: string;
  measurable: MeasurableData; // Updated from string to MeasurableData
  achievable: string;
  relevant: string;
  dueDate: string; // This is the overall goal due date, distinct from measurable target date if any
  createdAt: Timestamp;
  status: string;
  completed: boolean;
  category?: string;
  coachUid?: string;
  coachName?: string;
  coachStatus?: string;
  lastProgressUpdateAt?: Timestamp; // New field for streak calculation
}

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

  // State for chart data
  const [progressChartData, setProgressChartData] = useState<any>(null);
  const [overallProgressMessage, setOverallProgressMessage] =
    useState<string>("");

  const navigate = useNavigate();

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

  // Process SMART goals for chart data and motivational message
  useEffect(() => {
    if (smartGoals.length > 0) {
      const categoryCounts: { [key: string]: number } = {};
      let todayStreakCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      smartGoals.forEach((goal) => {
        const category = goal.category?.trim()
          ? goal.category.trim()
          : "Uncategorized";
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
        }
        categoryCounts[category]++;

        if (goal.lastProgressUpdateAt) {
          const updateDate = goal.lastProgressUpdateAt.toDate();
          updateDate.setHours(0, 0, 0, 0); // Start of the update day
          if (updateDate.getTime() === today.getTime()) {
            todayStreakCount++;
          }
        }
      });
      setStreakCount(todayStreakCount);

      const labels = Object.keys(categoryCounts);
      const data = labels.map((label) => categoryCounts[label]);
      // Example colors, can be customized
      const backgroundColors = [
        "#4CAF50",
        "#2196F3",
        "#FFC107",
        "#E91E63",
        "#9C27B0",
      ];
      const borderColors = [
        "#388E3C",
        "#1976D2",
        "#FFA000",
        "#C2185B",
        "#7B1FA2",
      ];

      setProgressChartData({
        labels,
        datasets: [
          {
            label: "SMART Goals by Category", // Updated label
            data,
            backgroundColor: labels.map(
              (_, i) => backgroundColors[i % backgroundColors.length]
            ),
            borderColor: labels.map(
              (_, i) => borderColors[i % borderColors.length]
            ),
            borderWidth: 1,
          },
        ],
      });

      // Update motivational message based on goal counts
      const totalGoals = smartGoals.length;
      if (totalGoals > 0) {
        setOverallProgressMessage(
          `You have ${totalGoals} SMART goal(s) in progress. Keep up the momentum!`
        );
      } else {
        setOverallProgressMessage(
          "No SMART goals yet. Add one to get started!"
        );
        setStreakCount(0);
      }
    } else {
      setProgressChartData(null); // Clear chart data if no goals
      setOverallProgressMessage(
        "No SMART goals yet. Create your first goal to see it on the chart!"
      );
      setStreakCount(0);
    }
  }, [smartGoals]); // Depend on smartGoals now

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

  // useEffect for chart data and streak count (based on smartGoals)
  useEffect(() => {
    if (smartGoals.length > 0) {
      const categoryCounts: { [key: string]: number } = {};
      let todayStreakCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      smartGoals.forEach((goal) => {
        const category = goal.category?.trim()
          ? goal.category.trim()
          : "Uncategorized";
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
        }
        categoryCounts[category]++;

        if (goal.lastProgressUpdateAt) {
          const updateDate = goal.lastProgressUpdateAt.toDate();
          updateDate.setHours(0, 0, 0, 0); // Start of the update day
          if (updateDate.getTime() === today.getTime()) {
            todayStreakCount++;
          }
        }
      });
      setStreakCount(todayStreakCount);

      const labels = Object.keys(categoryCounts);
      const data = labels.map((label) => categoryCounts[label]);
      // Example colors, can be customized
      const backgroundColors = [
        "#4CAF50",
        "#2196F3",
        "#FFC107",
        "#E91E63",
        "#9C27B0",
      ];
      const borderColors = [
        "#388E3C",
        "#1976D2",
        "#FFA000",
        "#C2185B",
        "#7B1FA2",
      ];

      setProgressChartData({
        labels,
        datasets: [
          {
            label: "SMART Goals by Category", // Updated label
            data,
            backgroundColor: labels.map(
              (_, i) => backgroundColors[i % backgroundColors.length]
            ),
            borderColor: labels.map(
              (_, i) => borderColors[i % borderColors.length]
            ),
            borderWidth: 1,
          },
        ],
      });

      // Update motivational message based on goal counts
      const totalGoals = smartGoals.length;
      if (totalGoals > 0) {
        setOverallProgressMessage(
          `You have ${totalGoals} SMART goal(s) in progress. Keep up the momentum!`
        );
      } else {
        setOverallProgressMessage(
          "No SMART goals yet. Add one to get started!"
        );
        setStreakCount(0);
      }
    } else {
      setProgressChartData(null); // Clear chart data if no goals
      setOverallProgressMessage(
        "No SMART goals yet. Create your first goal to see it on the chart!"
      );
      setStreakCount(0);
    }
  }, [smartGoals]); // This effect is solely for chart/UI elements derived from smartGoals

  return (
    <div className="dashboard-container space-y-6">
      {currentUser && (
        <header className="dashboard-header">
          <h1>
            Hey {currentUser.displayName || "User"}, Let's Keep the Momentum
            Going! 🚀
          </h1>
          {streakCount > 0 && (
            <div className="streak-banner">
              <i className="fas fa-fire"></i>
              <span>{streakCount} Goal(s) Updated Today! Keep it Up!</span>
            </div>
          )}
          {streakCount === 0 && currentUser && (
            <div className="streak-banner inactive">
              <i className="fas fa-seedling"></i>
              <span>Make progress on a goal today to start a streak!</span>
            </div>
          )}
        </header>
      )}

      <section className="dashboard-section progress-overview">
        <h2 className="section-title">Your Goals Snapshot</h2>{" "}
        {/* Changed title */}
        {loadingGoals && <p>Loading goals snapshot...</p>}{" "}
        {/* Changed text, ensure loadingGoals is used for this section if snapshot depends on goals */}
        {errorGoals && <p className="error-message">{errorGoals}</p>}{" "}
        {/* Ensure errorGoals is used */}
        {!loadingGoals && !errorGoals && progressChartData && (
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            {/* Limit chart size - removed extraneous characters that caused linting error */}
            <Doughnut
              data={progressChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  title: {
                    display: true,
                    text: "SMART Goal Categories", // Updated chart title
                  },
                },
              }}
            />
            {overallProgressMessage && (
              <p className="motivational-message text-center mt-4">
                {overallProgressMessage}
              </p>
            )}
          </div>
        )}
        {!loadingGoals &&
          !errorGoals &&
          !progressChartData &&
          smartGoals.length === 0 && ( // Check smartGoals length here
            <p>No SMART goals data yet to display the progress chart.</p>
          )}
      </section>

      <section id="smart-goals" className="dashboard-section">
        <h2 className="section-title">Your SMART Goals</h2>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smartGoals.map((goal) => {
            let formattedDueDate = "Date not set";
            if (goal.dueDate) {
              const date = new Date(goal.dueDate + "T00:00:00");
              if (!isNaN(date.getTime())) {
                formattedDueDate = date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              } else {
                formattedDueDate = "Invalid date format";
              }
            } else {
              formattedDueDate = "Due date not set";
            }

            // Visual Progress Indicator Logic
            let progressElement = null;
            if (goal.measurable && goal.measurable.type) {
              const { type, currentValue, targetValue, unit } = goal.measurable;
              if (type === "Numeric" || type === "DailyStreak") {
                const current =
                  typeof currentValue === "number" ? currentValue : 0;
                const target =
                  typeof targetValue === "number" && targetValue > 0
                    ? targetValue
                    : 0;
                const percentage =
                  target > 0 ? Math.min((current / target) * 100, 100) : 0;
                progressElement = (
                  <div className="goal-card-progress mt-2">
                    <div className="progress-bar-background">
                      <div
                        className="progress-bar-foreground"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text text-xs">
                      {current}/{target}{" "}
                      {unit || (type === "DailyStreak" ? "days" : "")}
                    </span>
                  </div>
                );
              } else if (type === "Boolean") {
                progressElement = (
                  <p className="text-xs mt-1">
                    Status: {currentValue ? "Completed" : "In Progress"}
                  </p>
                );
              } else if (type === "Date" && targetValue) {
                progressElement = (
                  <p className="text-xs mt-1">
                    Target:{" "}
                    {new Date(
                      (targetValue as string) + "T00:00:00"
                    ).toLocaleDateString()}
                  </p>
                );
              }
            }

            return (
              <div
                key={goal.id}
                className="goal-card bg-white shadow-lg rounded-lg p-5 flex flex-col justify-between"
              >
                <div>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      goal.completed
                        ? "text-gray-500 line-through"
                        : "text-blue-700"
                    }`}
                  >
                    {goal.description}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">
                    Category: {goal.category || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Overall Due: {formattedDueDate}
                  </p>

                  {progressElement}

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-semibold mb-1 text-gray-600">
                      S.M.A.R.T. Breakdown:
                    </h4>
                    <ul className="text-xs list-disc list-inside space-y-0.5 pl-1 text-gray-700">
                      <li>
                        <strong>S:</strong>{" "}
                        {goal.specific?.trim() || <em>Not provided</em>}
                      </li>
                      <li>
                        <strong>M:</strong>{" "}
                        {goal.measurable ? (
                          formatMeasurableData(goal.measurable)
                        ) : (
                          <em>Not provided</em>
                        )}
                      </li>
                      <li>
                        <strong>A:</strong>{" "}
                        {goal.achievable?.trim() || <em>Not provided</em>}
                      </li>
                      <li>
                        <strong>R:</strong>{" "}
                        {goal.relevant?.trim() || <em>Not provided</em>}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                  {!goal.completed &&
                    goal.measurable &&
                    (goal.measurable.type === "Numeric" ||
                      goal.measurable.type === "DailyStreak" ||
                      goal.measurable.type === "Boolean") && (
                      <button
                        onClick={() => handleUpdateProgress(goal)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded text-sm transition duration-150 ease-in-out"
                        disabled={
                          progressUpdateStatus[goal.id] === "Updating..." ||
                          progressUpdateStatus[goal.id] ===
                            "Progress Updated!" ||
                          progressUpdateStatus[goal.id] === "Already done"
                        }
                      >
                        {progressUpdateStatus[goal.id] ||
                          "Update Progress (Check-in)"}
                      </button>
                    )}
                  <button
                    onClick={() => handleShareMilestone(goal)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded text-sm transition duration-150 ease-in-out"
                  >
                    Share Milestone
                  </button>
                  {/* Placeholder for Mark as Complete, Coach Invite etc. can be re-added here if needed */}
                  {!goal.completed && goal.status !== "completed" && (
                    <button
                      onClick={() =>
                        handleMarkAsComplete(goal.id, goal.description)
                      }
                      className="w-full text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out mt-2"
                      disabled={goalUpdateStatus[goal.id] === "Updating..."}
                    >
                      {goalUpdateStatus[goal.id] ||
                        "Mark as Complete (Overall)"}
                    </button>
                  )}
                </div>
              </div>
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
