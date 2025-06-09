import React, { useState, useMemo } from "react";
import { SmartGoal, CoachingNote, GoalProgress } from "../types/Dashboard";
import { CoachNoteInput } from "./CoachNoteInput";
import { CoachingNotesPanel } from "./CoachingNotesPanel";
import "./CoachOverview.css";

interface CoachOverviewProps {
  coachId: string;
  coachName: string;
  assignedGoals: SmartGoal[];
  goalProgressMap: Map<string, GoalProgress>;
  coachingNotes: CoachingNote[];
  onAddCoachingNote: (
    note: Omit<CoachingNote, "id" | "createdAt" | "isRead">
  ) => Promise<void>;
  onMarkNoteAsRead?: (noteId: string) => Promise<void>;
}

type FilterType = "all" | "needs-attention" | "recent-notes" | "completed";
type SortType = "progress" | "due-date" | "last-updated" | "alphabetical";

export const CoachOverview: React.FC<CoachOverviewProps> = ({
  coachId,
  coachName,
  assignedGoals,
  goalProgressMap,
  coachingNotes,
  onAddCoachingNote,
  onMarkNoteAsRead,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("progress");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Calculate insights
  const insights = useMemo(() => {
    const totalGoals = assignedGoals.length;
    const completedGoals = assignedGoals.filter(
      (goal) => goal.completed
    ).length;
    const needsAttention = assignedGoals.filter((goal) => {
      const progress = goalProgressMap.get(goal.id);
      return (
        progress &&
        (progress.status === "overdue" ||
          (progress.daysWithoutProgress && progress.daysWithoutProgress > 7) ||
          progress.percentage < 25)
      );
    }).length;
    const recentNotes = coachingNotes.filter((note) => {
      const daysSince =
        (Date.now() - note.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    return {
      totalGoals,
      completedGoals,
      needsAttention,
      recentNotes,
      completionRate:
        totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    };
  }, [assignedGoals, goalProgressMap, coachingNotes]);

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = [...assignedGoals];

    // Apply filters
    switch (filter) {
      case "needs-attention":
        filtered = filtered.filter((goal) => {
          const progress = goalProgressMap.get(goal.id);
          return (
            progress &&
            (progress.status === "overdue" ||
              (progress.daysWithoutProgress &&
                progress.daysWithoutProgress > 7) ||
              progress.percentage < 25)
          );
        });
        break;
      case "recent-notes":
        filtered = filtered.filter((goal) => {
          const goalNotes = coachingNotes.filter(
            (note) => note.goalId === goal.id
          );
          return goalNotes.some((note) => {
            const daysSince =
              (Date.now() - note.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 7;
          });
        });
        break;
      case "completed":
        filtered = filtered.filter((goal) => goal.completed);
        break;
      default:
        // "all" - no filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const progressA = goalProgressMap.get(a.id);
      const progressB = goalProgressMap.get(b.id);

      switch (sortBy) {
        case "progress":
          return (progressB?.percentage || 0) - (progressA?.percentage || 0);
        case "due-date":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "last-updated":
          const lastUpdatedA = progressA?.lastUpdated?.getTime() || 0;
          const lastUpdatedB = progressB?.lastUpdated?.getTime() || 0;
          return lastUpdatedB - lastUpdatedA;
        case "alphabetical":
          return a.specific.localeCompare(b.specific);
        default:
          return 0;
      }
    });

    return filtered;
  }, [assignedGoals, goalProgressMap, coachingNotes, filter, sortBy]);

  const handleAddNote = async (
    note: Omit<CoachingNote, "id" | "createdAt" | "isRead">
  ) => {
    setIsSubmittingNote(true);
    try {
      await onAddCoachingNote(note);
      setShowNoteInput(null);
    } catch (error) {
      console.error("Failed to add coaching note:", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getGoalStatus = (goal: SmartGoal) => {
    const progress = goalProgressMap.get(goal.id);
    if (!progress) return { status: "unknown", color: "#6c757d" };

    switch (progress.status) {
      case "completed":
        return { status: "Completed", color: "#28a745" };
      case "overdue":
        return { status: "Overdue", color: "#dc3545" };
      case "in-progress":
        if (progress.daysWithoutProgress && progress.daysWithoutProgress > 7) {
          return { status: "Stalled", color: "#fd7e14" };
        }
        if (progress.percentage >= 75) {
          return { status: "On Track", color: "#17a2b8" };
        }
        return { status: "In Progress", color: "#ffc107" };
      default:
        return { status: "Not Started", color: "#6c757d" };
    }
  };

  return (
    <div className="coach-overview">
      {/* Header */}
      <div className="coach-overview__header">
        <h2>Coach Dashboard</h2>
        <p className="coach-name">Welcome, {coachName}</p>
      </div>

      {/* Insights Cards */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-value">{insights.totalGoals}</div>
          <div className="insight-label">Total Goals</div>
        </div>
        <div className="insight-card">
          <div className="insight-value">{insights.completionRate}%</div>
          <div className="insight-label">Completion Rate</div>
        </div>
        <div className="insight-card attention">
          <div className="insight-value">{insights.needsAttention}</div>
          <div className="insight-label">Need Attention</div>
        </div>
        <div className="insight-card">
          <div className="insight-value">{insights.recentNotes}</div>
          <div className="insight-label">Recent Notes</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="controls-bar">
        <div className="filter-group">
          <label htmlFor="filter-select">Filter:</label>
          <select
            id="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="filter-select"
          >
            <option value="all">All Goals ({assignedGoals.length})</option>
            <option value="needs-attention">
              Need Attention ({insights.needsAttention})
            </option>
            <option value="recent-notes">
              Recent Notes ({insights.recentNotes})
            </option>
            <option value="completed">
              Completed ({insights.completedGoals})
            </option>
          </select>
        </div>

        <div className="sort-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="sort-select"
          >
            <option value="progress">Progress</option>
            <option value="due-date">Due Date</option>
            <option value="last-updated">Last Updated</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="goals-list">
        {filteredAndSortedGoals.length === 0 ? (
          <div className="empty-state">
            <p>No goals match the current filter.</p>
          </div>
        ) : (
          filteredAndSortedGoals.map((goal) => {
            const progress = goalProgressMap.get(goal.id);
            const goalNotes = coachingNotes.filter(
              (note) => note.goalId === goal.id
            );
            const status = getGoalStatus(goal);
            const unreadNotes = goalNotes.filter((note) => !note.isRead).length;

            return (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <div className="goal-info">
                    <h3 className="goal-title">{goal.specific}</h3>
                    <p className="goal-category">
                      {goal.category || "Uncategorized"}
                    </p>
                    <p className="goal-due">
                      Due: {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="goal-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.status}
                    </span>
                    {progress && (
                      <div className="progress-indicator">
                        <span className="progress-text">
                          {progress.percentage}%
                        </span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progress.percentage}%`,
                              backgroundColor: status.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="goal-actions">
                  <button
                    className="action-btn notes-btn"
                    onClick={() =>
                      setSelectedGoalId(
                        selectedGoalId === goal.id ? null : goal.id
                      )
                    }
                  >
                    💬 Notes ({goalNotes.length})
                    {unreadNotes > 0 && (
                      <span className="unread-badge">{unreadNotes} new</span>
                    )}
                  </button>

                  <button
                    className="action-btn add-note-btn"
                    onClick={() =>
                      setShowNoteInput(
                        showNoteInput === goal.id ? null : goal.id
                      )
                    }
                  >
                    ➕ Add Note
                  </button>
                </div>

                {/* Expanded sections */}
                {selectedGoalId === goal.id && goalNotes.length > 0 && (
                  <div className="notes-section">
                    <CoachingNotesPanel
                      notes={goalNotes}
                      onMarkAsRead={onMarkNoteAsRead}
                      isCoachView={true}
                    />
                  </div>
                )}

                {showNoteInput === goal.id && (
                  <div className="note-input-section">
                    <CoachNoteInput
                      goalId={goal.id}
                      goalTitle={goal.specific}
                      coachId={coachId}
                      coachName={coachName}
                      onSubmit={handleAddNote}
                      onCancel={() => setShowNoteInput(null)}
                      isSubmitting={isSubmittingNote}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
