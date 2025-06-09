import React, { useState, useMemo } from "react";
import {
  DashboardInsights,
  SmartGoal,
  CoachingNote,
  Achievement,
} from "../types/Dashboard";
import "./InsightsPanel.css";

interface InsightsPanelProps {
  insights?: DashboardInsights;
  goals?: SmartGoal[];
  coachingNotes?: CoachingNote[];
  achievements?: Achievement[];
  onInsightAction?: (insightType: string, actionData: unknown) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isLoading?: boolean;
}

interface InsightItem {
  id: string;
  type: "performance" | "motivational" | "actionable" | "coaching" | "trend";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  icon: string;
  actionable?: boolean;
  actionText?: string;
  actionData?: unknown;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  goals,
  coachingNotes,
  achievements,
  onInsightAction,
  isExpanded = true,
  onToggleExpanded,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    "all" | "actions" | "achievements"
  >("all");

  // Generate smart insights from the data
  const smartInsights = useMemo((): InsightItem[] => {
    const insightsList: InsightItem[] = [];

    // Handle both direct props and insights object
    const overallProgress = insights?.overallProgress || 0;
    const stalledGoals =
      insights?.stalledGoals || goals?.filter((g) => !g.completed) || [];
    const upcomingDeadlines = insights?.upcomingDeadlines || [];
    const recentAchievements = insights?.achievements || achievements || [];
    const recentCoachingNotes =
      insights?.recentCoachingFeedback || coachingNotes || [];

    // Performance Insights
    if (overallProgress > 0) {
      if (overallProgress >= 80) {
        insightsList.push({
          id: "high-performance",
          type: "performance",
          title: "Exceptional Progress!",
          description: `You're ${overallProgress}% complete overall. Keep up the amazing work!`,
          priority: "high",
          icon: "🏆",
          actionable: false,
        });
      } else if (overallProgress >= 60) {
        insightsList.push({
          id: "good-progress",
          type: "performance",
          title: "Strong Progress",
          description: `You're ${overallProgress}% complete. You're doing great!`,
          priority: "medium",
          icon: "📈",
          actionable: false,
        });
      }
    }

    // Stalled Goals
    if (stalledGoals.length > 0) {
      insightsList.push({
        id: "stalled-goals",
        type: "actionable",
        title: `${stalledGoals.length} Goal${
          stalledGoals.length > 1 ? "s" : ""
        } Need Attention`,
        description: `${stalledGoals.length} goal${
          stalledGoals.length > 1 ? "s have" : " has"
        } been stalled.`,
        priority: "high",
        icon: "🔄",
        actionable: true,
        actionText: "Review Goals",
        actionData: { type: "stalled-goals", goals: stalledGoals },
      });
    }

    // Upcoming Deadlines
    if (upcomingDeadlines.length > 0) {
      insightsList.push({
        id: "upcoming-deadlines",
        type: "actionable",
        title: `${upcomingDeadlines.length} Deadline${
          upcomingDeadlines.length > 1 ? "s" : ""
        } Approaching`,
        description: `${upcomingDeadlines.length} goal${
          upcomingDeadlines.length > 1 ? "s are" : " is"
        } due soon.`,
        priority: "high",
        icon: "📅",
        actionable: true,
        actionText: "View Deadlines",
        actionData: { type: "deadlines", goals: upcomingDeadlines },
      });
    }

    // Recent Coaching Notes
    if (recentCoachingNotes.length > 0) {
      const unreadNotes = recentCoachingNotes.filter((note) => !note.isRead);
      if (unreadNotes.length > 0) {
        insightsList.push({
          id: "coaching-feedback",
          type: "coaching",
          title: `New feedback from ${unreadNotes[0].coachName}`,
          description: `You have ${unreadNotes.length} unread coaching note${
            unreadNotes.length > 1 ? "s" : ""
          }.`,
          priority: "medium",
          icon: "💬",
          actionable: true,
          actionText: "View Notes",
          actionData: { type: "coaching-notes", notes: unreadNotes },
        });
      }
    }

    // Recent Achievements
    if (recentAchievements.length > 0) {
      recentAchievements.forEach((achievement) => {
        insightsList.push({
          id: `achievement-${achievement.id}`,
          type: "motivational",
          title: achievement.title,
          description: achievement.description,
          priority: "medium",
          icon: "🎉",
          actionable: false,
        });
      });
    }

    return insightsList;
  }, [insights, goals, coachingNotes, achievements]);

  const filteredInsights = useMemo(() => {
    switch (activeTab) {
      case "actions":
        return smartInsights.filter((insight) => insight.actionable);
      case "achievements":
        return smartInsights.filter(
          (insight) =>
            insight.type === "motivational" || insight.type === "performance"
        );
      default:
        return smartInsights;
    }
  }, [smartInsights, activeTab]);

  const handleInsightAction = (insight: InsightItem) => {
    if (onInsightAction && insight.actionable && insight.actionData) {
      onInsightAction(insight.type, insight.actionData);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "";
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "performance":
        return "type-performance";
      case "motivational":
        return "type-motivational";
      case "actionable":
        return "type-actionable";
      case "coaching":
        return "type-coaching";
      case "trend":
        return "type-trend";
      default:
        return "";
    }
  };

  if (!isExpanded) {
    const highPriorityCount = smartInsights.filter(
      (i) => i.priority === "high"
    ).length;
    const actionableCount = smartInsights.filter((i) => i.actionable).length;

    return (
      <div className="insights-panel collapsed">
        <button
          className="insights-toggle"
          onClick={onToggleExpanded}
          aria-label="Expand insights panel"
        >
          <span className="toggle-icon">📊</span>
          <span className="toggle-text">
            {highPriorityCount > 0
              ? `${highPriorityCount} insights`
              : "View insights"}
          </span>
          {actionableCount > 0 && (
            <span className="action-badge">{actionableCount}</span>
          )}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="insights-panel loading"
        role="region"
        aria-label="Smart Insights"
      >
        <p>Generating insights...</p>
      </div>
    );
  }

  if (smartInsights.length === 0) {
    return (
      <div
        className="insights-panel empty"
        role="region"
        aria-label="Smart Insights"
      >
        <h3>Smart Insights</h3>
        <p>No insights available</p>
        <p>Start working on your goals to see personalized insights here.</p>
      </div>
    );
  }

  return (
    <div
      className="insights-panel expanded"
      role="region"
      aria-label="Smart Insights"
    >
      <div className="insights-header">
        <div className="header-content">
          <h3>Smart Insights</h3>
          <p>Personalized recommendations to help you succeed</p>
        </div>
        {onToggleExpanded && (
          <button
            className="collapse-btn"
            onClick={onToggleExpanded}
            aria-label="Collapse insights panel"
          >
            ✕
          </button>
        )}
      </div>

      <div className="insights-tabs" role="tablist">
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
          role="tab"
          aria-selected={activeTab === "all"}
          aria-controls="insights-content"
        >
          All Insights
        </button>
        <button
          className={`tab ${activeTab === "actions" ? "active" : ""}`}
          onClick={() => setActiveTab("actions")}
          role="tab"
          aria-selected={activeTab === "actions"}
          aria-controls="insights-content"
        >
          Actions
        </button>
        <button
          className={`tab ${activeTab === "achievements" ? "active" : ""}`}
          onClick={() => setActiveTab("achievements")}
          role="tab"
          aria-selected={activeTab === "achievements"}
          aria-controls="insights-content"
        >
          Achievements
        </button>
      </div>

      <div className="insights-list" id="insights-content" role="tabpanel">
        {filteredInsights.length === 0 ? (
          <div className="empty-insights">
            <p>No insights available for this filter.</p>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className={`insight-item ${getPriorityClass(
                insight.priority
              )} ${getTypeClass(insight.type)}`}
              data-testid={`insight-item-${insight.id}`}
              aria-describedby={`insight-desc-${insight.id}`}
            >
              <div className="insight-icon">{insight.icon}</div>

              <div className="insight-content">
                <h4 className="insight-title">{insight.title}</h4>
                <p
                  className="insight-description"
                  id={`insight-desc-${insight.id}`}
                >
                  {insight.description}
                </p>

                {insight.actionable && insight.actionText && (
                  <div className="insight-actions">
                    <button
                      className="insight-action"
                      onClick={() => handleInsightAction(insight)}
                      aria-label={`${insight.actionText} for ${insight.title}`}
                    >
                      {insight.actionText} →
                    </button>
                    {insight.id === "stalled-goals" && insight.actionData ? (
                      <React.Fragment>
                        <button
                          className="action-btn update-progress"
                          onClick={() =>
                            onInsightAction?.(
                              "update_progress",
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (insight.actionData as Record<string, any>)
                                .goals?.[0]?.id
                            )
                          }
                          aria-label="Update progress"
                        >
                          Update Progress
                        </button>
                        <button
                          className="action-btn view-goal"
                          onClick={() =>
                            onInsightAction?.(
                              "view_goal",
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (insight.actionData as Record<string, any>)
                                .goals?.[0]?.id
                            )
                          }
                          aria-label="View goal"
                        >
                          View Goal
                        </button>
                      </React.Fragment>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="insight-meta">
                <span className={`priority-badge ${insight.priority}`}>
                  {insight.priority === "high" ? "🔥" : ""}
                  {insight.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
