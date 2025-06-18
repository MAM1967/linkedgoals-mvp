import React from "react";
import { Timestamp } from "firebase/firestore";

// Replicating the SmartGoal type from Dashboard.tsx to ensure correctness
// In a larger refactor, this would be in a shared types file.
interface MeasurableData {
  type: "boolean" | "number" | "steps";
  targetValue: number;
  currentValue: number;
  unit?: string;
  steps?: { name: string; completed: boolean }[];
}

interface SmartGoal {
  id: string;
  name: string;
  description: string;
  category: string;
  specific: string;
  measurable: MeasurableData;
  achievable: string;
  relevant: string;
  timeBound: string;
  createdAt: Timestamp;
  completed: boolean;
  sharedWithCoach: boolean;
  coachNotes?: string[];
  dueDate?: Timestamp;
}

// Define styles directly in the component file
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: "#ffffff",
    border: "1px solid #e4e9f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    color: "#2d3748", // --color-text-primary
    fontFamily: '"Inter", sans-serif',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    margin: "0 0 4px 0",
  },
  category: {
    fontSize: "14px",
    color: "#6c7b8a", // --color-text-secondary
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 500,
  },
  description: {
    fontSize: "16px",
    lineHeight: 1.5,
  },
};

interface GoalProgressCardProps {
  goal: SmartGoal;
  // For now, only include the props we are actively using.
  onViewDetails: (goal: SmartGoal) => void;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  goal,
  onViewDetails,
}) => {
  const statusStyle = {
    borderLeft: goal.completed ? "4px solid #22c55e" : "4px solid #0077b5", // Green for completed, blue for in-progress
  };

  return (
    <div
      style={{ ...styles.card, ...statusStyle }}
      onClick={() => onViewDetails(goal)}
    >
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>{goal.name}</h3>
          <p style={styles.category}>{goal.category}</p>
        </div>
      </div>
      <div style={styles.description}>
        <p>{goal.description}</p>
      </div>
      {/* Buttons can be added back here later if needed */}
    </div>
  );
};
