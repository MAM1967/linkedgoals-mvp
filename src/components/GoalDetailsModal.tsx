import React, { useState, useEffect } from "react";
import { SmartGoal, GoalProgress } from "../types/Dashboard";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import Tooltip from "./common/Tooltip";
import "./GoalDetailsModal.css";

interface GoalDetailsModalProps {
  goal: SmartGoal;
  progress: GoalProgress;
  isOpen: boolean;
  onClose: () => void;
  onGoalUpdate?: (updatedGoal: SmartGoal) => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  goal,
  progress,
  isOpen,
  onClose,
  onGoalUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<SmartGoal>(goal);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    setEditedGoal(goal);
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

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const goalRef = doc(db, `users/${auth.currentUser.uid}/goals`, goal.id);
      await updateDoc(goalRef, {
        specific: editedGoal.specific,
        description: editedGoal.description,
        achievable: editedGoal.achievable,
        relevant: editedGoal.relevant,
        dueDate: editedGoal.dueDate,
        category: editedGoal.category,
        measurable: editedGoal.measurable,
      });

      setSaveStatus("Saved successfully! ✅");
      setIsEditing(false);
      onGoalUpdate?.(editedGoal);

      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error updating goal:", error);
      setSaveStatus("Error saving changes ❌");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedGoal(goal);
    setIsEditing(false);
    setSaveStatus("");
  };

  const formatMeasurableDisplay = () => {
    const { type, currentValue, targetValue, unit } = goal.measurable;

    switch (type) {
      case "Numeric":
        return `${currentValue || 0} / ${targetValue || 0} ${unit || ""}`;
      case "DailyStreak":
        return `${currentValue || 0} / ${targetValue || 0} days`;
      case "Boolean":
        return currentValue ? "Completed ✅" : "Not completed ⏳";
      case "Date":
        return `Target: ${new Date(
          targetValue as string
        ).toLocaleDateString()}`;
      default:
        return "No progress tracking";
    }
  };

  const getProgressColor = () => {
    if (progress.percentage >= 80) return "#28a745";
    if (progress.percentage >= 60) return "#17a2b8";
    if (progress.percentage >= 40) return "#ffc107";
    if (progress.percentage >= 20) return "#fd7e14";
    return "#dc3545";
  };

  const getDaysRemaining = () => {
    const dueDate = new Date(goal.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMotivationalMessage = () => {
    const daysRemaining = getDaysRemaining();
    const progressPercentage = progress.percentage;

    if (progressPercentage >= 90) {
      return "🎉 You're almost there! The finish line is in sight!";
    } else if (progressPercentage >= 70) {
      return "💪 Great momentum! Keep pushing forward!";
    } else if (progressPercentage >= 50) {
      return "🚀 You're halfway there! Don't give up now!";
    } else if (daysRemaining <= 7 && progressPercentage < 50) {
      return "⚡ Final sprint time! Focus on what matters most!";
    } else {
      return "🌟 Every step counts! You've got this!";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="goal-details-modal-overlay" onClick={onClose}>
      <div className="goal-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{isEditing ? "Edit Goal" : "Goal Details"}</h2>
            <div
              className="progress-badge"
              style={{ backgroundColor: getProgressColor() }}
            >
              {progress.percentage}% Complete
            </div>
          </div>
          <div className="modal-actions">
            {!isEditing && (
              <Tooltip text="Edit this goal" position="bottom">
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </button>
              </Tooltip>
            )}
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div
            className={`save-status ${
              saveStatus.includes("Error") ? "error" : "success"
            }`}
          >
            {saveStatus}
          </div>
        )}

        {/* Content */}
        <div className="modal-content">
          {/* Progress Overview */}
          <section className="progress-overview">
            <h3>Progress Overview</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-label">Current Progress</span>
                <span className="stat-value">{formatMeasurableDisplay()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Days Remaining</span>
                <span className="stat-value">
                  {getDaysRemaining() > 0
                    ? `${getDaysRemaining()} days`
                    : "Overdue"}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Status</span>
                <span className="stat-value">{progress.status}</span>
              </div>
            </div>
            <div className="motivational-message">
              {getMotivationalMessage()}
            </div>
          </section>

          {/* SMART Breakdown */}
          <section className="smart-breakdown-section">
            <h3>SMART Goal Breakdown</h3>
            <div className="smart-items">
              <div className="smart-item">
                <label>
                  <strong>S - Specific:</strong>
                  {isEditing ? (
                    <textarea
                      value={editedGoal.specific}
                      onChange={(e) =>
                        setEditedGoal({
                          ...editedGoal,
                          specific: e.target.value,
                        })
                      }
                      placeholder="What exactly do you want to achieve?"
                    />
                  ) : (
                    <span>{goal.specific}</span>
                  )}
                </label>
              </div>

              <div className="smart-item">
                <label>
                  <strong>M - Measurable:</strong>
                  <span>{formatMeasurableDisplay()}</span>
                </label>
              </div>

              <div className="smart-item">
                <label>
                  <strong>A - Achievable:</strong>
                  {isEditing ? (
                    <textarea
                      value={editedGoal.achievable}
                      onChange={(e) =>
                        setEditedGoal({
                          ...editedGoal,
                          achievable: e.target.value,
                        })
                      }
                      placeholder="How will you achieve this?"
                    />
                  ) : (
                    <span>{goal.achievable}</span>
                  )}
                </label>
              </div>

              <div className="smart-item">
                <label>
                  <strong>R - Relevant:</strong>
                  {isEditing ? (
                    <textarea
                      value={editedGoal.relevant}
                      onChange={(e) =>
                        setEditedGoal({
                          ...editedGoal,
                          relevant: e.target.value,
                        })
                      }
                      placeholder="Why is this goal important?"
                    />
                  ) : (
                    <span>{goal.relevant}</span>
                  )}
                </label>
              </div>

              <div className="smart-item">
                <label>
                  <strong>T - Time-bound:</strong>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedGoal.dueDate}
                      onChange={(e) =>
                        setEditedGoal({
                          ...editedGoal,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span>
                      Due {new Date(goal.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </section>

          {/* Coaching Notes */}
          {progress.coachingNotes && progress.coachingNotes.length > 0 && (
            <section className="coaching-notes-section">
              <h3>Coaching Notes</h3>
              <div className="coaching-notes-list">
                {progress.coachingNotes.map((note, index) => (
                  <div key={index} className="coaching-note">
                    <div className="note-header">
                      <span className="coach-name">{note.coachName}</span>
                      <span className="note-date">
                        {note.createdAt instanceof Date
                          ? note.createdAt.toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="note-content">{note.note}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
