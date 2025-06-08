import React, { useEffect, useState } from "react";
import { getGoals } from "../../lib/firebase";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import "./GoalManagement.css";

interface Goal {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdAt: {
    toDate: () => Date;
  };
}

const GoalManagement: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { goals: newGoals, last } = await getGoals(lastVisible);
      setGoals((prevGoals) => [...prevGoals, ...newGoals] as Goal[]);
      setLastVisible(last);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <div className="goal-management">
      <h1>Goal Management</h1>
      <div className="goal-list">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>User ID</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr key={goal.id}>
                <td>{goal.title}</td>
                <td>{goal.description}</td>
                <td>{goal.userId}</td>
                <td>{goal.createdAt?.toDate()?.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={fetchGoals} disabled={loading || !lastVisible}>
        {loading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
};

export default GoalManagement;
