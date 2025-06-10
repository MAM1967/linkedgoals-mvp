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
  motivationalMessage: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  overallProgress,
  insights,
  motivationalMessage,
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
      {/* Main Progress Section */}
      <div className="dashboard-header__main">
        <div className="dashboard-header__progress">
          <Tooltip text="Your overall goal completion rate" position="bottom">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${averageProgress}, 100`}
                  style={{ stroke: progressColor }}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {averageProgress}%
                </text>
              </svg>
            </div>
          </Tooltip>

          <div className="progress-details">
            <h1 className="dashboard-title">Your Goal Progress</h1>
            <p className="progress-summary">
              {completed} of {total} goals completed
            </p>
            {activeGoals > 0 && (
              <p className="active-goals">
                {activeGoals} goal{activeGoals !== 1 ? "s" : ""} in progress
              </p>
            )}
          </div>
        </div>

        <Tooltip
          text="AI-generated encouragement based on your progress"
          position="left"
        >
          <div className="motivational-message">
            <p>{motivationalMessage}</p>
          </div>
        </Tooltip>
      </div>

      {/* Quick Stats */}
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
              position="bottom"
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
              position="bottom"
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
              position="bottom"
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
