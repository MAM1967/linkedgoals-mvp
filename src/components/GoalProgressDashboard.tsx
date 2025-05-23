import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

type GoalProgressDashboardProps = {
  userId: string;
};

export default function GoalProgressDashboard({
  userId,
}: GoalProgressDashboardProps) {
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchGoalProgress = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const goalsSnapshot = await getDocs(
        collection(db, `users/${user.uid}/goals`)
      );
      const progress: Record<string, number> = {};

      for (const doc of goalsSnapshot.docs) {
        const goalId = doc.id;

        const checkinsRef = collection(db, `users/${user.uid}/checkins`);
        const checkinsQuery = query(checkinsRef, where("goalId", "==", goalId));
        const checkinsSnapshot = await getDocs(checkinsQuery);

        progress[goalId] = checkinsSnapshot.size;
      }

      setGoalProgress(progress);
    };

    fetchGoalProgress();
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Goal Progress</h3>
      <ul className="list-disc pl-6">
        {Object.entries(goalProgress).map(([goalId, count]) => (
          <li key={goalId}>
            Goal ID: {goalId} – Check-ins: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}
