import React from "react";
import { CategoryProgress } from "../types/Dashboard";
import Tooltip from "./common/Tooltip";
import "./CategoryProgressSummary.css";

interface CategoryProgressSummaryProps {
  categoryProgress: Map<string, CategoryProgress>;
  onCategoryClick?: (category: string) => void;
}

export const CategoryProgressSummary: React.FC<
  CategoryProgressSummaryProps
> = ({ categoryProgress, onCategoryClick }) => {
  // Convert Map to Array and sort by average progress (descending)
  const categories = Array.from(categoryProgress.values()).sort(
    (a, b) => b.averageProgress - a.averageProgress
  );

  if (categories.length === 0) {
    return (
      <div className="category-progress-summary empty">
        <p>No categories found</p>
        <p>Start by creating some goals to see your progress here.</p>
      </div>
    );
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return "var(--progress-excellent)"; // Green
    if (percentage >= 60) return "var(--progress-good)"; // Teal
    if (percentage >= 40) return "var(--progress-fair)"; // Yellow
    if (percentage >= 20) return "var(--progress-needs-work)"; // Orange
    return "var(--progress-started)"; // Red
  };

  const getProgressLabel = (percentage: number): string => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Fair";
    if (percentage >= 20) return "Needs Work";
    return "Just Started";
  };

  const handleCategoryClick = (category: string) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div
      className="category-progress-summary"
      role="region"
      aria-label="Category progress summary"
    >
      <div className="summary-header">
        <h3>Progress by Category</h3>
        <span className="category-count">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      <div className="categories-grid">
        {categories.map((category) => {
          const progressColor = getProgressColor(category.averageProgress);
          const progressLabel = getProgressLabel(category.averageProgress);

          return (
            <div
              key={category.category}
              className={`category-card ${onCategoryClick ? "clickable" : ""} ${
                category.averageProgress === 100 ? "completed" : ""
              } ${category.averageProgress < 30 ? "needs-attention" : ""} ${
                category.hasCoachingAttention ? "has-coaching-attention" : ""
              }`}
              data-testid={`category-card-${category.category}`}
              onClick={() => handleCategoryClick(category.category)}
              role="button"
              tabIndex={0}
              aria-label={`${category.category} category, ${category.averageProgress}% complete, ${category.completedGoals} of ${category.totalGoals} goals completed`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCategoryClick(category.category);
                }
              }}
            >
              {/* Header */}
              <div className="category-header">
                <h4 className="category-name">{category.category}</h4>
                {category.hasCoachingAttention && (
                  <Tooltip
                    text="This category has active coaching feedback"
                    position="top"
                  >
                    <span className="coaching-indicator">💬</span>
                  </Tooltip>
                )}
              </div>

              {/* Progress Circle */}
              <Tooltip
                text={`Average completion rate for ${category.category}`}
                position="top"
              >
                <div className="category-progress">
                  <div className="progress-circle-container">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle"
                        strokeDasharray={`${category.averageProgress}, 100`}
                        style={{ stroke: progressColor }}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" className="percentage">
                        {category.averageProgress}%
                      </text>
                    </svg>
                  </div>

                  <div className="progress-label">
                    <Tooltip
                      text={`Status based on average progress: ${progressLabel}`}
                      position="top"
                    >
                      <span
                        className="label-text"
                        style={{ color: progressColor }}
                      >
                        {progressLabel}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </Tooltip>

              {/* Stats */}
              <div className="category-stats">
                <div className="stat-row">
                  <span className="stat-label">Goals:</span>
                  <span className="stat-value">
                    {category.completedGoals}/{category.totalGoals} completed
                  </span>
                </div>

                {category.averageProgress < 100 && (
                  <div className="stat-row">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value">
                      {category.averageProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div
                className="category-progress-bar"
                role="progressbar"
                aria-valuenow={category.averageProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${category.category} progress: ${category.averageProgress}%`}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${category.averageProgress}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>

              {/* Action Indicators */}
              <div className="category-indicators">
                {category.averageProgress < 30 && (
                  <Tooltip
                    text="This category may need more focus"
                    position="top"
                  >
                    <span className="indicator needs-attention">
                      ⚠️ Needs Focus
                    </span>
                  </Tooltip>
                )}

                {category.completedGoals > 0 &&
                  category.averageProgress >= 80 && (
                    <Tooltip
                      text="You're doing great in this category!"
                      position="top"
                    >
                      <span className="indicator excellent">🌟 Excellent</span>
                    </Tooltip>
                  )}

                {category.hasCoachingAttention && (
                  <Tooltip
                    text="A coach has left feedback in this category"
                    position="top"
                  >
                    <span className="indicator coaching">💬 Coach Notes</span>
                  </Tooltip>
                )}
              </div>

              {/* Goals Summary */}
              <div className="category-goals">
                <div className="goals-summary">
                  <span className="goals-summary-text">
                    This category contains {category.totalGoals} goal
                    {category.totalGoals !== 1 ? "s" : ""}
                    {category.completedGoals > 0 && (
                      <> ({category.completedGoals} completed)</>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="category-actions">
                <Tooltip
                  text={`Filter dashboard to show only ${category.category} goals`}
                  position="top"
                >
                  <button
                    className="view-goals-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.category);
                    }}
                    aria-label={`View goals in ${category.category} category`}
                  >
                    View Goals
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Insights */}
      <div className="category-insights">
        {(() => {
          const topCategory = categories[0];
          const bottomCategory = categories[categories.length - 1];
          const totalCompleted = categories.reduce(
            (sum, cat) => sum + cat.completedGoals,
            0
          );
          const totalGoals = categories.reduce(
            (sum, cat) => sum + cat.totalGoals,
            0
          );
          const categoriesWithCoaching = categories.filter(
            (cat) => cat.hasCoachingAttention
          ).length;

          return (
            <div className="insights-grid">
              <div className="insight-card best">
                <span className="insight-icon">🏆</span>
                <div className="insight-content">
                  <h5>Top Performer</h5>
                  <p>
                    {topCategory.category} ({topCategory.averageProgress}%)
                  </p>
                </div>
              </div>

              {bottomCategory.averageProgress < 50 && (
                <div className="insight-card focus">
                  <span className="insight-icon">🎯</span>
                  <div className="insight-content">
                    <h5>Focus Area</h5>
                    <p>
                      {bottomCategory.category} (
                      {bottomCategory.averageProgress}%)
                    </p>
                  </div>
                </div>
              )}

              <div className="insight-card overall">
                <span className="insight-icon">📊</span>
                <div className="insight-content">
                  <h5>Overall</h5>
                  <p>
                    {totalCompleted}/{totalGoals} goals completed
                  </p>
                </div>
              </div>

              {categoriesWithCoaching > 0 && (
                <div className="insight-card coaching">
                  <span className="insight-icon">💬</span>
                  <div className="insight-content">
                    <h5>Coaching Active</h5>
                    <p>
                      {categoriesWithCoaching} categor
                      {categoriesWithCoaching !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
