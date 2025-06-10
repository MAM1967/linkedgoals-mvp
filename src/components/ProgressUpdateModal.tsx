import React, { useState, useEffect } from "react";
import { SmartGoal } from "../types/Dashboard";
import Tooltip from "./common/Tooltip";
import "./ProgressUpdateModal.css";

interface ProgressUpdateModalProps {
  goal: SmartGoal;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (goalId: string, newValue: number | string | boolean) => void;
}

export const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  goal,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [updateValue, setUpdateValue] = useState<number | string | boolean>(0);
  const [updateMode, setUpdateMode] = useState<"increment" | "set" | "custom">(
    "increment"
  );
  const [customInput, setCustomInput] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [prediction, setPrediction] = useState<string>("");

  useEffect(() => {
    if (!goal.measurable) return;

    const { type, currentValue } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        setUpdateValue((currentValue as number) || 0);
        break;
      }
      case "Boolean": {
        setUpdateValue((currentValue as boolean) || false);
        break;
      }
      case "Date": {
        setUpdateValue((currentValue as string) || "");
        break;
      }
    }

    // Calculate prediction
    calculatePrediction();
  }, [goal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const calculatePrediction = () => {
    if (!goal.measurable) return;

    const { type, currentValue, targetValue } = goal.measurable;
    const dueDate = new Date(goal.dueDate);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (type === "Numeric" || type === "DailyStreak") {
      const current = (currentValue as number) || 0;
      const target = (targetValue as number) || 1;
      const remaining = target - current;

      if (remaining <= 0) {
        setPrediction("🎉 Goal already achieved! Amazing work!");
      } else if (daysRemaining > 0) {
        const dailyRate = remaining / daysRemaining;
        if (dailyRate <= 1) {
          setPrediction(
            `💪 You need ${dailyRate.toFixed(1)} ${
              goal.measurable.unit || "units"
            } per day to reach your goal on time!`
          );
        } else {
          setPrediction(
            `⚡ Challenge mode! You need ${dailyRate.toFixed(1)} ${
              goal.measurable.unit || "units"
            } per day. You've got this!`
          );
        }
      } else {
        setPrediction("🏃‍♂️ Final sprint! Every update counts!");
      }
    }
  };

  const getCurrentProgress = () => {
    if (!goal.measurable) return 0;

    const { type, currentValue, targetValue } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const current = (currentValue as number) || 0;
        const target = (targetValue as number) || 1;
        return Math.min(100, (current / target) * 100);
      }
      case "Boolean": {
        return (currentValue as boolean) ? 100 : 0;
      }
      case "Date": {
        // For dates, calculate based on time passed
        const targetDate = new Date(targetValue as string);
        const today = new Date();
        if (today >= targetDate) return 100;
        return 0;
      }
      default:
        return 0;
    }
  };

  const getProjectedProgress = () => {
    if (!goal.measurable) return 0;

    const { type, targetValue } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const newValue = updateValue as number;
        const target = (targetValue as number) || 1;
        return Math.min(100, (newValue / target) * 100);
      }
      case "Boolean": {
        return (updateValue as boolean) ? 100 : 0;
      }
      default:
        return getCurrentProgress();
    }
  };

  const handleIncrement = () => {
    if (!goal.measurable) return;

    const { type, currentValue } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const current = (currentValue as number) || 0;
        setUpdateValue(current + 1);
        break;
      }
      case "Boolean": {
        setUpdateValue(true);
        break;
      }
    }
  };

  const handleDecrement = () => {
    if (!goal.measurable) return;

    const { type, currentValue } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const current = (currentValue as number) || 0;
        setUpdateValue(Math.max(0, current - 1));
        break;
      }
      case "Boolean": {
        setUpdateValue(false);
        break;
      }
    }
  };

  const handleCustomSubmit = () => {
    if (!goal.measurable) return;

    const { type } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak": {
        const numValue = parseFloat(customInput);
        if (!isNaN(numValue) && numValue >= 0) {
          setUpdateValue(numValue);
        }
        break;
      }
      case "Date": {
        setUpdateValue(customInput);
        break;
      }
    }
    setCustomInput("");
  };

  const handleUpdate = () => {
    const currentProgress = getCurrentProgress();
    const newProgress = getProjectedProgress();

    // Show confetti for significant milestones
    if (newProgress >= 100 || newProgress - currentProgress >= 25) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    onUpdate(goal.id, updateValue);
    onClose();
  };

  const getMilestoneMessage = () => {
    const progress = getProjectedProgress();

    if (progress >= 100) {
      return "🎉 GOAL COMPLETE! You're a superstar!";
    } else if (progress >= 75) {
      return "🔥 Almost there! The finish line is in sight!";
    } else if (progress >= 50) {
      return "🚀 Halfway hero! Keep the momentum going!";
    } else if (progress >= 25) {
      return "💪 Great progress! You're building momentum!";
    } else {
      return "🌟 Every step counts! You're on your way!";
    }
  };

  const getStreakInfo = () => {
    if (!goal.measurable || goal.measurable.type !== "DailyStreak") return "";

    const current = (goal.measurable.currentValue as number) || 0;

    if (current >= 7) {
      return `🔥 ${current} day streak! You're on fire!`;
    } else if (current >= 3) {
      return `📈 ${current} day streak! Building the habit!`;
    } else if (current >= 1) {
      return `🎯 ${current} day streak! Great start!`;
    }

    return "💪 Ready to start your streak?";
  };

  if (!isOpen || !goal.measurable) return null;

  const { type, unit } = goal.measurable;

  return (
    <div className="progress-update-modal-overlay" onClick={onClose}>
      <div
        className="progress-update-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {showConfetti && <div className="confetti-container">🎉✨🎊⭐🌟💫</div>}

        {/* Header */}
        <div className="modal-header">
          <h2>Update Progress</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Goal Info */}
        <div className="goal-info-section">
          <h3>{goal.specific}</h3>
          <div className="progress-bars">
            <div className="progress-comparison">
              <div className="progress-bar-container">
                <label>Current Progress</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill current"
                    style={{ width: `${getCurrentProgress()}%` }}
                  />
                </div>
                <span>{getCurrentProgress().toFixed(0)}%</span>
              </div>

              <div className="progress-bar-container">
                <label>New Progress</label>
                <div className="progress-bar">
                  <div
                    className="progress-fill projected"
                    style={{ width: `${getProjectedProgress()}%` }}
                  />
                </div>
                <span>{getProjectedProgress().toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction & Streak */}
        {prediction && (
          <div className="prediction-section">
            <div className="prediction-message">{prediction}</div>
          </div>
        )}

        {type === "DailyStreak" && (
          <div className="streak-section">
            <div className="streak-message">{getStreakInfo()}</div>
          </div>
        )}

        {/* Update Controls */}
        <div className="update-controls">
          <div className="mode-selector">
            <button
              className={`mode-btn ${
                updateMode === "increment" ? "active" : ""
              }`}
              onClick={() => setUpdateMode("increment")}
            >
              Quick Update
            </button>
            <button
              className={`mode-btn ${updateMode === "custom" ? "active" : ""}`}
              onClick={() => setUpdateMode("custom")}
            >
              Set Value
            </button>
          </div>

          {updateMode === "increment" &&
            (type === "Numeric" || type === "DailyStreak") && (
              <div className="increment-controls">
                <Tooltip text="Decrease by 1" position="top">
                  <button
                    className="increment-btn decrease"
                    onClick={handleDecrement}
                  >
                    −
                  </button>
                </Tooltip>

                <div className="current-value">
                  <span className="value">{updateValue}</span>
                  <span className="unit">
                    {unit || (type === "DailyStreak" ? "days" : "")}
                  </span>
                </div>

                <Tooltip text="Increase by 1" position="top">
                  <button
                    className="increment-btn increase"
                    onClick={handleIncrement}
                  >
                    +
                  </button>
                </Tooltip>
              </div>
            )}

          {updateMode === "increment" && type === "Boolean" && (
            <div className="boolean-controls">
              <button
                className={`boolean-btn ${!updateValue ? "active" : ""}`}
                onClick={() => setUpdateValue(false)}
              >
                Not Complete
              </button>
              <button
                className={`boolean-btn ${updateValue ? "active" : ""}`}
                onClick={() => setUpdateValue(true)}
              >
                ✅ Complete
              </button>
            </div>
          )}

          {updateMode === "custom" && (
            <div className="custom-controls">
              {type === "Date" ? (
                <div className="date-input-group">
                  <label>Set completion date:</label>
                  <input
                    type="date"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                  <button onClick={handleCustomSubmit}>Set Date</button>
                </div>
              ) : (
                <div className="number-input-group">
                  <label>Enter new value:</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter value..."
                      min="0"
                    />
                    <span className="unit-label">
                      {unit || (type === "DailyStreak" ? "days" : "")}
                    </span>
                  </div>
                  <button onClick={handleCustomSubmit}>Set Value</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Milestone Message */}
        <div className="milestone-section">
          <div className="milestone-message">{getMilestoneMessage()}</div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="update-btn" onClick={handleUpdate}>
            🚀 Update Progress
          </button>
        </div>
      </div>
    </div>
  );
};
