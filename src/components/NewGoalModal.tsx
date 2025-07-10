import React from "react";
import { SmartGoal, GoalProgress } from "../types/Dashboard";

interface NewGoalModalProps {
  goal: SmartGoal;
  progress: GoalProgress;
  isOpen: boolean;
  onClose: () => void;
}

export const NewGoalModal: React.FC<NewGoalModalProps> = ({
  goal,
  progress,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const getDaysRemaining = () => {
    const today = new Date();
    const dueDate = new Date(goal.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatMeasurable = () => {
    if (!goal.measurable) return "No progress tracking";
    const { currentValue, targetValue, unit } = goal.measurable;

    const current = currentValue ?? 0;
    const target = targetValue ?? 0;
    const unitText = unit || "";

    if (!target) return "No progress tracking";

    return `${current} / ${target} ${unitText}`.trim();
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "700px",
    maxHeight: "85vh",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#0077b5",
    color: "white",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "22px",
    fontWeight: "600",
    color: "white",
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    marginLeft: "15px",
  };

  const closeStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "5px",
  };

  const contentStyle: React.CSSProperties = {
    padding: "20px",
    maxHeight: "60vh",
    overflowY: "auto",
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "25px",
  };

  const h3Style: React.CSSProperties = {
    margin: "0 0 15px 0",
    fontSize: "18px",
    color: "#333",
    fontWeight: "600",
  };

  const statsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "15px",
    marginBottom: "20px",
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: "#f8f9fa",
    border: "2px solid #0077b5",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#0077b5",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: "8px",
    display: "block",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "16px",
    color: "#333",
    fontWeight: "bold",
    display: "block",
  };

  const motivationStyle: React.CSSProperties = {
    backgroundColor: "#0077b5",
    color: "white",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "500",
  };

  const smartItemStyle: React.CSSProperties = {
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "12px",
  };

  const smartLabelStyle: React.CSSProperties = {
    color: "#0077b5",
    fontWeight: "600",
    marginRight: "8px",
  };

  const smartTextStyle: React.CSSProperties = {
    color: "#333",
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={titleStyle}>Goal Details</h2>
            <span style={badgeStyle}>{progress.percentage}% Complete</span>
          </div>
          <button style={closeStyle} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Progress Overview */}
          <div style={sectionStyle}>
            <h3 style={h3Style}>Progress Overview</h3>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <span style={statLabelStyle}>Current Progress</span>
                <span style={statValueStyle}>{formatMeasurable()}</span>
              </div>
              <div style={statCardStyle}>
                <span style={statLabelStyle}>Days Remaining</span>
                <span style={statValueStyle}>
                  {getDaysRemaining() > 0
                    ? `${getDaysRemaining()} days`
                    : "Overdue"}
                </span>
              </div>
              <div style={statCardStyle}>
                <span style={statLabelStyle}>Status</span>
                <span style={statValueStyle}>{progress.status}</span>
              </div>
            </div>
            <div style={motivationStyle}>
              🚀 You're making great progress! Keep it up!
            </div>
          </div>

          {/* SMART Goal Breakdown */}
          <div style={sectionStyle}>
            <h3 style={h3Style}>SMART Goal Breakdown</h3>

            <div style={smartItemStyle}>
              <span style={smartLabelStyle}>S - Specific:</span>
              <span style={smartTextStyle}>{goal.specific}</span>
            </div>

            <div style={smartItemStyle}>
              <span style={smartLabelStyle}>M - Measurable:</span>
              <span style={smartTextStyle}>{formatMeasurable()}</span>
            </div>

            <div style={smartItemStyle}>
              <span style={smartLabelStyle}>A - Achievable:</span>
              <span style={smartTextStyle}>{goal.achievable}</span>
            </div>

            <div style={smartItemStyle}>
              <span style={smartLabelStyle}>R - Relevant:</span>
              <span style={smartTextStyle}>{goal.relevant}</span>
            </div>

            <div style={smartItemStyle}>
              <span style={smartLabelStyle}>T - Time-bound:</span>
              <span style={smartTextStyle}>
                Due {new Date(goal.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
