import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
// import { useSearchParams } from "react-router-dom";
import { CoachOverview } from "./CoachOverview";
import { SmartGoal, CoachingNote, GoalProgress } from "../types/Dashboard";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  collectionGroup,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./CoachingDashboard.css";

const CoachingDashboard: React.FC = () => {
  const { user } = useAuth();
  // const [searchParams] = useSearchParams();
  // const highlightGoalId = searchParams.get("highlight");
  // TODO: Use highlightGoalId to highlight specific goal when redirected from onboarding

  const [assignedGoals, setAssignedGoals] = useState<SmartGoal[]>([]);
  const [goalProgressMap, setGoalProgressMap] = useState<
    Map<string, GoalProgress>
  >(new Map());
  const [coachingNotes, setCoachingNotes] = useState<CoachingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    // Query for goals where the current user is the coach
    const goalsQuery = query(
      collectionGroup(db, "goals"),
      where("coachUid", "==", user.uid)
    );

    const unsubscribeGoals = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const goals: SmartGoal[] = [];
        const progressMap = new Map<string, GoalProgress>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const goal: SmartGoal = {
            id: doc.id,
            description: data.description || "",
            specific: data.specific || "",
            measurable: data.measurable || {
              type: "Boolean",
              targetValue: null,
              currentValue: false,
            },
            achievable: data.achievable || "",
            relevant: data.relevant || "",
            dueDate: data.dueDate || "",
            createdAt: data.createdAt || new Date(),
            status: data.status || "active",
            completed: data.completed || false,
            category: data.category || "General",
            coachUid: data.coachUid,
            coachName: data.coachName,
            coachStatus: data.coachStatus,
          };

          goals.push(goal);

          // Calculate progress
          let percentage = 0;
          let status: GoalProgress["status"] = "not-started";

          if (goal.completed) {
            percentage = 100;
            status = "completed";
          } else if (
            goal.measurable.type === "Numeric" &&
            typeof goal.measurable.currentValue === "number" &&
            typeof goal.measurable.targetValue === "number"
          ) {
            percentage = Math.min(
              100,
              Math.round(
                (goal.measurable.currentValue / goal.measurable.targetValue) *
                  100
              )
            );
            status = percentage > 0 ? "in-progress" : "not-started";
          } else if (
            goal.measurable.type === "Boolean" &&
            goal.measurable.currentValue === true
          ) {
            percentage = 100;
            status = "completed";
          }

          // Check if overdue
          const dueDate = new Date(goal.dueDate);
          const now = new Date();
          if (dueDate < now && !goal.completed) {
            status = "overdue";
          }

          progressMap.set(goal.id, {
            goalId: goal.id,
            percentage,
            status,
            lastUpdated: new Date(),
            hasUnreadCoachNotes: false,
          });
        });

        // Successfully loaded data - clear any previous errors
        setError(null);
        setAssignedGoals(goals);
        setGoalProgressMap(progressMap);
        setIsCoach(goals.length > 0);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching coaching goals:", err);

        // Check if this is a permission error or network error
        if (err.code === "permission-denied") {
          setError(
            "You don't have permission to view coaching assignments. Please check your account settings."
          );
        } else if (err.code === "unavailable") {
          setError(
            "Unable to connect to the server. Please check your internet connection and try again."
          );
        } else {
          // For other errors, show a generic message but don't prevent the user from seeing the empty state
          console.warn("Coaching query failed, showing empty state:", err);
          setAssignedGoals([]);
          setGoalProgressMap(new Map());
          setIsCoach(false);
          setError(null); // Don't show error for empty results
        }
        setLoading(false);
      }
    );

    unsubscribes.push(unsubscribeGoals);

    // Query for coaching notes for goals the user coaches
    const notesQuery = query(
      collectionGroup(db, "coachingNotes"),
      where("coachId", "==", user.uid)
    );

    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes: CoachingNote[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          goalId: doc.data().goalId,
          coachId: doc.data().coachId,
          coachName: doc.data().coachName,
          note: doc.data().note,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          isRead: doc.data().isRead || false,
          type: doc.data().type || "feedback",
        }));
        setCoachingNotes(notes);
      },
      (err) => {
        console.error("Error fetching coaching notes:", err);
        // Don't show error for coaching notes - they're secondary
      }
    );

    unsubscribes.push(unsubscribeNotes);

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  const handleAddCoachingNote = async (
    note: Omit<CoachingNote, "id" | "createdAt" | "isRead">
  ) => {
    if (!user) return;

    try {
      const notesRef = collection(db, "coachingNotes");
      await addDoc(notesRef, {
        ...note,
        createdAt: serverTimestamp(),
        isRead: false,
      });
      console.log("Coaching note added successfully");
    } catch (error) {
      console.error("Error adding coaching note:", error);
      throw error;
    }
  };

  const handleMarkNoteAsRead = async (noteId: string) => {
    console.log("Mark note as read:", noteId);
  };

  if (loading) {
    return (
      <div className="coaching-dashboard-loading">
        <p>Loading your coaching assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coaching-dashboard-error">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle case where user is not a coach
  if (isCoach === false) {
    return (
      <div className="coaching-dashboard-empty">
        <h2>Welcome to Coaching</h2>
        <p>
          You don't have any coaching assignments yet. This is where you'll see
          goals from people who invite you to be their accountability coach.
        </p>
        <div className="coaching-info">
          <h3>How Coaching Works</h3>
          <ul>
            <li>
              <strong>Get Invited:</strong> Someone shares a coaching invitation
              link with you
            </li>
            <li>
              <strong>Accept & Connect:</strong> Click the link to become their
              accountability coach
            </li>
            <li>
              <strong>Support & Guide:</strong> Help them stay on track with
              their goals
            </li>
            <li>
              <strong>Track Progress:</strong> Monitor their progress and
              provide feedback
            </li>
          </ul>
        </div>
        <div className="coaching-tips">
          <h3>Want to Start Coaching?</h3>
          <ul>
            <li>
              Let friends and colleagues know you're available as an
              accountability coach
            </li>
            <li>
              Share your expertise and willingness to help others achieve their
              goals
            </li>
            <li>
              When someone creates a goal, they can invite you using your email
              address
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <CoachOverview
      coachId={user?.uid || ""}
      coachName={user?.displayName || "Coach"}
      assignedGoals={assignedGoals}
      goalProgressMap={goalProgressMap}
      coachingNotes={coachingNotes}
      onAddCoachingNote={handleAddCoachingNote}
      onMarkNoteAsRead={handleMarkNoteAsRead}
    />
  );
};

export default CoachingDashboard;
