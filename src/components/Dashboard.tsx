"use client";

import { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { Link } from "react-router-dom";

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
}

interface SmartGoal {
  id: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  dueDate: string;
  createdAt: Timestamp;
  status: string;
  completed: boolean;
  coachUid?: string;
  coachName?: string;
  coachStatus?: string;
}

// Type for the data part of the goal, excluding the ID
type SmartGoalData = Omit<SmartGoal, "id">;

export default function Dashboard() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [errorGoals, setErrorGoals] = useState<string | null>(null);
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingGoals(false);
      setErrorGoals("Please log in to view your goals.");
      return;
    }

    const fetchCheckins = async () => {
      console.log("Fetching checkins (if applicable)...");
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
          });
        }
        setCheckins(results);
      } catch (err) {
        console.error("Error fetching checkins:", err);
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
          // Correctly construct the object to avoid potential linter warning
          const goalData = doc.data() as SmartGoalData;
          fetchedGoals.push({ ...goalData, id: doc.id });
        });
        setSmartGoals(fetchedGoals);
        setLoadingGoals(false);
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
  }, []);

  const handleMarkAsComplete = async (goalId: string, description: string) => {
    if (!auth.currentUser) {
      setGoalUpdateStatus({
        ...goalUpdateStatus,
        [goalId]: "Error: Not logged in",
      });
      return;
    }
    setGoalUpdateStatus({ ...goalUpdateStatus, [goalId]: "Updating..." });
    const goalRef = doc(db, `users/${auth.currentUser.uid}/goals`, goalId);
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

  const handleShareForCoaching = (goalId: string, description: string) => {
    // Implementation of handleShareForCoaching function
  };

  const handleDeclineCoach = (goalId: string) => {
    // Implementation of handleDeclineCoach function
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Your Progress (Check-ins)
        </h2>
        {checkins.length === 0 && !loadingGoals && <p>No check-ins yet.</p>}
        {checkins.map((entry) => (
          <div
            key={entry.id}
            className="border p-4 rounded bg-white shadow-sm mb-4"
          >
            <p className="text-sm text-gray-500">
              {entry.circle} –{" "}
              {entry.createdAt?.toDate
                ? entry.createdAt.toDate().toLocaleDateString()
                : "No date"}
            </p>
            <p className="mt-1">{entry.message}</p>
            {entry.goal && (
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3">
                <p className="font-medium">
                  🎯 Associated Goal: {entry.goal.name}
                </p>
                {entry.goal.description && (
                  <p className="text-sm text-gray-700">
                    {entry.goal.description}
                  </p>
                )}
                {entry.goal.dueDate && (
                  <p className="text-xs text-gray-500">
                    Due: {new Date(entry.goal.dueDate).toLocaleDateString()}
                  </p>
                )}
                {entry.goal.completed && (
                  <p className="text-green-600 text-sm mt-1 font-medium">
                    ✅ Completed
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your SMART Goals</h2>

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

        {loadingGoals && <p>Loading your goals...</p>}
        {errorGoals && <p className="text-red-500">{errorGoals}</p>}
        {!loadingGoals && smartGoals.length === 0 && !errorGoals && (
          <p>
            You haven't created any SMART goals yet. Go to "Add Goal" to create
            one!
          </p>
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

            return (
              <div
                key={goal.id}
                className="border p-4 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <h3
                  className={`text-xl font-semibold ${
                    goal.completed
                      ? "text-gray-500 line-through"
                      : "text-blue-600"
                  }`}
                >
                  {goal.description}
                </h3>
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    Due: {formattedDueDate}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      goal.completed
                        ? "text-green-600"
                        : goal.status === "active"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Status: {goal.status} {goal.completed ? "(Completed)" : ""}
                  </p>
                  {goal.coachName && (
                    <p className="text-xs text-purple-600 mt-1">
                      Coached by: {goal.coachName} (
                      {goal.coachStatus || "Status pending"})
                    </p>
                  )}
                </div>

                {!goal.completed &&
                  !goal.coachUid &&
                  goal.status !== "completed" && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <button
                        onClick={() =>
                          handleMarkAsComplete(goal.id, goal.description)
                        }
                        className="w-full text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                        disabled={goalUpdateStatus[goal.id] === "Updating..."}
                      >
                        {goalUpdateStatus[goal.id] || "Mark as Complete"}
                      </button>
                      <button
                        onClick={() =>
                          handleShareForCoaching(goal.id, goal.description)
                        }
                        className="w-full text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                      >
                        Invite Coach
                      </button>
                    </div>
                  )}

                {goal.coachUid &&
                  goal.coachName &&
                  goal.status !== "completed" && (
                    <div className="mt-3 pt-3 border-t text-center">
                      <p className="text-sm text-gray-700 mb-2">
                        Awaiting acceptance from {goal.coachName}.
                      </p>
                      <button
                        onClick={() => handleDeclineCoach(goal.id)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition duration-150 ease-in-out text-xs"
                        disabled={declineCoachStatus[goal.id] === "Removing..."}
                      >
                        {declineCoachStatus[goal.id] || "Cancel Coach Invite"}
                      </button>
                    </div>
                  )}

                <div className="mt-4 pt-3 border-t">
                  <h4 className="text-sm font-semibold mb-1">
                    S.M.A.R.T. Details:
                  </h4>
                  <ul className="text-xs list-disc list-inside space-y-1 pl-1">
                    <li>
                      <strong>S:</strong>{" "}
                      {goal.specific?.trim() ? (
                        goal.specific
                      ) : (
                        <em>Not provided</em>
                      )}
                    </li>
                    <li>
                      <strong>M:</strong>{" "}
                      {goal.measurable?.trim() ? (
                        goal.measurable
                      ) : (
                        <em>Not provided</em>
                      )}
                    </li>
                    <li>
                      <strong>A:</strong>{" "}
                      {goal.achievable?.trim() ? (
                        goal.achievable
                      ) : (
                        <em>Not provided</em>
                      )}
                    </li>
                    <li>
                      <strong>R:</strong>{" "}
                      {goal.relevant?.trim() ? (
                        goal.relevant
                      ) : (
                        <em>Not provided</em>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
