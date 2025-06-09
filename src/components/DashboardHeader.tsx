import React from "react";
import { DashboardInsights } from "../types/Dashboard";
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

  return (
    <div className="dashboard-header">
      {/* Main Progress Section */}
      <div className="dashboard-header__main">
        <div className="dashboard-header__progress">
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
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">
                {averageProgress}%
              </text>
            </svg>
          </div>

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

        <div className="motivational-message">
          <p>{motivationalMessage}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dashboard-header__stats">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Goals</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{activeGoals}</div>
          <div className="stat-label">Active</div>
        </div>

        {needsAttention > 0 && (
          <div className="stat-card attention">
            <div className="stat-value">{needsAttention}</div>
            <div className="stat-label">Need Attention</div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {(needsAttention > 0 || hasNewCoachingFeedback) && (
        <div className="dashboard-header__notifications">
          {stalledGoals.length > 0 && (
            <div className="notification warning">
              <span className="notification-icon">⚠️</span>
              <span>
                {stalledGoals.length} goal{stalledGoals.length !== 1 ? "s" : ""}{" "}
                stalled
              </span>
            </div>
          )}

          {upcomingDeadlines.length > 0 && (
            <div className="notification info">
              <span className="notification-icon">📅</span>
              <span>
                {upcomingDeadlines.length} deadline
                {upcomingDeadlines.length !== 1 ? "s" : ""} approaching
              </span>
            </div>
          )}

          {hasNewCoachingFeedback && (
            <div className="notification success">
              <span className="notification-icon">💬</span>
              <span>New coaching feedback available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
