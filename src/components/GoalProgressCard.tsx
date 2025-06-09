import React, { useState } from "react";
import { SmartGoal, GoalProgress } from "../types/Dashboard";
import { CoachingNotesPanel } from "./CoachingNotesPanel";
import "./GoalProgressCard.css";

interface GoalProgressCardProps {
  goal: SmartGoal;
  progress: GoalProgress;
  onUpdateProgress?: (goalId: string) => void;
  onMarkComplete?: (goalId: string) => void;
  onViewDetails?: (goalId: string) => void;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  goal,
  progress,
  onUpdateProgress,
  onMarkComplete,
  onViewDetails,
}) => {
  const [showCoachingNotes, setShowCoachingNotes] = useState(false);

  const { percentage, status, hasUnreadCoachNotes, coachingNotes } = progress;
  const isCompleted = status === "completed";
  const isOverdue = status === "overdue";
  const isStalled =
    progress.daysWithoutProgress && progress.daysWithoutProgress > 7;

  // Format due date
  const dueDate = new Date(goal.dueDate);
  const isUpcoming = dueDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
  const dueDateFormatted = dueDate.toLocaleDateString();

  // Progress bar color based on status
  const getProgressColor = () => {
    if (isCompleted) return "#28a745";
    if (isOverdue) return "#dc3545";
    if (percentage >= 75) return "#17a2b8";
    if (percentage >= 50) return "#ffc107";
    return "#6c757d";
  };

  // Status badge
  const getStatusBadge = () => {
    if (isCompleted) return { text: "Completed", class: "completed" };
    if (isOverdue) return { text: "Overdue", class: "overdue" };
    if (isStalled) return { text: "Stalled", class: "stalled" };
    if (isUpcoming) return { text: "Due Soon", class: "upcoming" };
    return { text: "In Progress", class: "in-progress" };
  };

  const statusBadge = getStatusBadge();

  // Format measurable data for display
  const formatMeasurableProgress = () => {
    if (!goal.measurable) {
      return "Progress tracking";
    }

    const { type, currentValue, targetValue, unit } = goal.measurable;

    switch (type) {
      case "Numeric":
      case "DailyStreak":
        return `${currentValue || 0} / ${targetValue || 0} ${
          unit || (type === "DailyStreak" ? "days" : "")
        }`;
      case "Boolean":
        return currentValue ? "Completed" : "Not completed";
      case "Date":
        return `Target: ${new Date(
          targetValue as string
        ).toLocaleDateString()}`;
      default:
        return "Progress tracking";
    }
  };

  return (
    <div
      className={`goal-progress-card ${status}`}
      data-testid="goal-progress-card"
      role="article"
      aria-label={`Goal: ${goal.specific}, ${percentage}% complete`}
    >
      {/* Header */}
      <div className="goal-progress-card__header">
        <div className="goal-info">
          <h3 className="goal-title">{goal.specific}</h3>
          <p className="goal-category">{goal.category || "Uncategorized"}</p>
        </div>

        <div className="goal-badges">
          <span className={`status-badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
          {hasUnreadCoachNotes && (
            <span className="coaching-badge unread">💬 New</span>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="goal-progress-card__progress">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-percentage">{percentage}%</span>
        </div>

        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${percentage}%`}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>

        <div className="progress-details">
          <span className="measurable-progress">
            {formatMeasurableProgress()}
          </span>
          <span className="due-date">Due: {dueDateFormatted}</span>
        </div>
      </div>

      {/* Goal Description */}
      {goal.description && (
        <div className="goal-description">
          <p>{goal.description}</p>
        </div>
      )}

      {/* Coaching Notes Preview */}
      {coachingNotes && coachingNotes.length > 0 && (
        <div className="coaching-preview">
          <button
            className="coaching-toggle"
            onClick={() => setShowCoachingNotes(!showCoachingNotes)}
          >
            <span>💬</span>
            <span>
              {coachingNotes.length} coaching note
              {coachingNotes.length !== 1 ? "s" : ""}
              {hasUnreadCoachNotes && " (new)"}
            </span>
            <span className={`chevron ${showCoachingNotes ? "open" : ""}`}>
              ▼
            </span>
          </button>

          {showCoachingNotes && <CoachingNotesPanel notes={coachingNotes} />}
        </div>
      )}

      {/* Actions */}
      <div className="goal-progress-card__actions">
        {!isCompleted && onUpdateProgress && (
          <button
            className="action-btn primary"
            onClick={() => onUpdateProgress(goal.id)}
          >
            Update Progress
          </button>
        )}

        {!isCompleted && onMarkComplete && percentage >= 90 && (
          <button
            className="action-btn success"
            onClick={() => onMarkComplete(goal.id)}
          >
            Mark Complete
          </button>
        )}

        {onViewDetails && (
          <button
            className="action-btn secondary"
            onClick={() => onViewDetails(goal.id)}
          >
            View Details
          </button>
        )}
      </div>

      {/* Smart Criteria Breakdown (Collapsible) */}
      <details className="smart-breakdown">
        <summary>SMART Breakdown</summary>
        <div className="smart-details">
          <div className="smart-item">
            <strong>S - Specific:</strong>
            <span>{goal.specific}</span>
          </div>
          <div className="smart-item">
            <strong>M - Measurable:</strong>
            <span>{formatMeasurableProgress()}</span>
          </div>
          <div className="smart-item">
            <strong>A - Achievable:</strong>
            <span>{goal.achievable}</span>
          </div>
          <div className="smart-item">
            <strong>R - Relevant:</strong>
            <span>{goal.relevant}</span>
          </div>
          <div className="smart-item">
            <strong>T - Time-bound:</strong>
            <span>Due {dueDateFormatted}</span>
          </div>
        </div>
      </details>
    </div>
  );
};
