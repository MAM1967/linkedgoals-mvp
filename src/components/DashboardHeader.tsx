import React from "react";
import { DashboardInsights } from "../types/Dashboard";
import Tooltip from "./common/Tooltip";
import "./DashboardHeader.css";

interface DashboardHeaderProps {
  overallProgress: {
    completed: number;
    total: number;
    percentage: number;
    averageProgress: number;
  };
  insights: DashboardInsights;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  overallProgress,
  insights,
}) => {
  const { completed, total, averageProgress } = overallProgress;
  const { stalledGoals, upcomingDeadlines, recentCoachingFeedback } = insights;

  // Calculate quick stats
  const activeGoals = total - completed;
  const needsAttention = stalledGoals.length + upcomingDeadlines.length;
  const hasNewCoachingFeedback = recentCoachingFeedback.length > 0;

  // Get progress color for better contrast using CSS variables
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return "var(--progress-excellent)"; // Green
    if (percentage >= 60) return "var(--progress-good)"; // Teal
    if (percentage >= 40) return "var(--progress-fair)"; // Yellow
    if (percentage >= 20) return "var(--progress-needs-work)"; // Orange
    return "var(--progress-started)"; // Red
  };

  const progressColor = getProgressColor(averageProgress);

  return (
    <div className="dashboard-header">
      {/* Simple Header with Linear Progress */}
      <div className="header-content">
        <h1 className="dashboard-title">Your Goal Progress</h1>

        <div className="linear-progress-section">
          <div className="progress-info">
            <span className="progress-percentage">{averageProgress}%</span>
            <span className="progress-text">Overall Progress</span>
          </div>

          <div className="linear-progress-bar">
            <div
              className="linear-progress-fill"
              style={{
                width: `${averageProgress}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-header__stats">
        <Tooltip text="Total goals you've created" position="top">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Goals</div>
          </div>
        </Tooltip>

        <Tooltip text="Goals you've completed" position="top">
          <div className="stat-card">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </Tooltip>

        <Tooltip text="Goals you are currently working on" position="top">
          <div className="stat-card">
            <div className="stat-value">{activeGoals}</div>
            <div className="stat-label">Active</div>
          </div>
        </Tooltip>

        {needsAttention > 0 && (
          <Tooltip
            text="Goals that are stalled or have approaching deadlines"
            position="top"
          >
            <div className="stat-card attention">
              <div className="stat-value">{needsAttention}</div>
              <div className="stat-label">Need Attention</div>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Notifications */}
      {(needsAttention > 0 || hasNewCoachingFeedback) && (
        <div className="dashboard-header__notifications">
          {stalledGoals.length > 0 && (
            <Tooltip
              text="Goals that have not seen progress recently"
              position="top"
            >
              <div className="notification warning">
                <span className="notification-icon">⚠️</span>
                <span>
                  {stalledGoals.length} goal
                  {stalledGoals.length !== 1 ? "s" : ""} stalled
                </span>
              </div>
            </Tooltip>
          )}

          {upcomingDeadlines.length > 0 && (
            <Tooltip
              text="Goals with deadlines in the next 7 days"
              position="top"
            >
              <div className="notification info">
                <span className="notification-icon">📅</span>
                <span>
                  {upcomingDeadlines.length} deadline
                  {upcomingDeadlines.length !== 1 ? "s" : ""} approaching
                </span>
              </div>
            </Tooltip>
          )}

          {hasNewCoachingFeedback && (
            <Tooltip
              text="You have unread feedback from your coach"
              position="top"
            >
              <div className="notification success">
                <span className="notification-icon">💬</span>
                <span>New coaching feedback available</span>
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};
