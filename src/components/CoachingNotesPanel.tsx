import React, { useState } from "react";
import { CoachingNote } from "../types/Dashboard";
import "./CoachingNotesPanel.css";

interface CoachingNotesPanelProps {
  notes: CoachingNote[];
  onMarkAsRead?: (noteId: string) => void;
  onReply?: (noteId: string) => void;
  onAddNote?: (noteData: { note: string; type: CoachingNote["type"] }) => void;
  isCoachView?: boolean;
  isLoading?: boolean;
  error?: string;
}

export const CoachingNotesPanel: React.FC<CoachingNotesPanelProps> = ({
  notes,
  onMarkAsRead,
  onReply,
  onAddNote,
  isCoachView = false,
  isLoading = false,
  error,
}) => {
  const [filter, setFilter] = useState<
    "all" | "encouragement" | "suggestion" | "feedback" | "milestone"
  >("all");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<CoachingNote["type"]>("feedback");
  const [validationError, setValidationError] = useState("");

  // Handle loading state
  if (isLoading) {
    return (
      <div
        className="coaching-notes-panel loading"
        role="region"
        aria-label="Coaching notes"
      >
        <p>Loading coaching notes...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div
        className="coaching-notes-panel error"
        role="region"
        aria-label="Coaching notes"
      >
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          aria-label="Retry loading notes"
        >
          Retry
        </button>
      </div>
    );
  }

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter notes based on current filter
  const filteredNotes =
    filter === "all"
      ? sortedNotes
      : sortedNotes.filter((note) => note.type === filter);

  const handleNoteClick = (note: CoachingNote) => {
    if (!note.isRead && onMarkAsRead) {
      onMarkAsRead(note.id);
    }
  };

  const handleReply = (noteId: string) => {
    if (onReply) {
      onReply(noteId);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      setValidationError("Note content is required");
      return;
    }

    setValidationError("");
    if (onAddNote) {
      onAddNote({
        note: newNote.trim(),
        type: noteType,
      });
      setNewNote("");
      setNoteType("feedback");
    }
  };

  const getNoteIcon = (type: CoachingNote["type"]) => {
    switch (type) {
      case "feedback":
        return "📝";
      case "encouragement":
        return "🎉";
      case "suggestion":
        return "💡";
      case "milestone":
        return "🏆";
      default:
        return "💬";
    }
  };

  const getNoteTypeLabel = (type: CoachingNote["type"]) => {
    switch (type) {
      case "feedback":
        return "Feedback";
      case "encouragement":
        return "Encouragement";
      case "suggestion":
        return "Suggestion";
      case "milestone":
        return "Milestone";
      default:
        return "Note";
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (sortedNotes.length === 0 && !isCoachView) {
    return (
      <div className="coaching-notes-panel empty">
        <p>No coaching notes yet</p>
        <p>Your coach will provide feedback and guidance here.</p>
      </div>
    );
  }

  return (
    <div
      className="coaching-notes-panel"
      role="region"
      aria-label="Coaching notes"
    >
      <div className="notes-header">
        <h4>Coach Feedback</h4>
        <span className="notes-count">
          {sortedNotes.length} note{sortedNotes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filter Buttons */}
      {sortedNotes.length > 0 && (
        <div className="notes-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${
              filter === "encouragement" ? "active" : ""
            }`}
            onClick={() => setFilter("encouragement")}
          >
            Encouragement
          </button>
          <button
            className={`filter-btn ${filter === "suggestion" ? "active" : ""}`}
            onClick={() => setFilter("suggestion")}
          >
            Suggestions
          </button>
          <button
            className={`filter-btn ${filter === "feedback" ? "active" : ""}`}
            onClick={() => setFilter("feedback")}
          >
            Feedback
          </button>
          <button
            className={`filter-btn ${filter === "milestone" ? "active" : ""}`}
            onClick={() => setFilter("milestone")}
          >
            Milestones
          </button>
        </div>
      )}

      {/* Coach View - Add Note Interface */}
      {isCoachView && (
        <div className="add-note-section">
          <h5>Add New Note</h5>
          <div className="note-form">
            <select
              value={noteType}
              onChange={(e) =>
                setNoteType(e.target.value as CoachingNote["type"])
              }
              aria-label="Note type"
            >
              <option value="feedback">Feedback</option>
              <option value="encouragement">Encouragement</option>
              <option value="suggestion">Suggestion</option>
              <option value="milestone">Milestone</option>
            </select>

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              maxLength={500}
              aria-label="Note content"
            />

            <div className="note-form-footer">
              <span className="char-count">{newNote.length}/500</span>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                aria-label="Add note"
              >
                Add Note
              </button>
            </div>

            {validationError && (
              <div className="validation-error" role="alert">
                {validationError}
              </div>
            )}
          </div>
        </div>
      )}

      <ul className="notes-list" role="list">
        {filteredNotes.map((note) => (
          <li
            key={note.id}
            className={`coaching-note ${note.type} ${
              !note.isRead ? "unread" : ""
            }`}
            data-testid={`coaching-note-${note.id}`}
            onClick={() => handleNoteClick(note)}
            role="listitem"
            tabIndex={0}
            aria-label={`${!note.isRead ? "Unread note" : "Note"} from ${
              note.coachName
            }: ${note.note}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNoteClick(note);
              }
            }}
          >
            <div className="note-header">
              <div className="note-meta">
                <span className="note-icon">{getNoteIcon(note.type)}</span>
                <span className="note-type">{getNoteTypeLabel(note.type)}</span>
                {!note.isRead && <span className="unread-indicator">●</span>}
              </div>
              <div className="note-info">
                <span className="coach-name">{note.coachName}</span>
                <span className="note-date">{formatDate(note.createdAt)}</span>
              </div>
            </div>

            <div className="note-content">
              <p>{note.note}</p>
            </div>

            {/* Reply Button */}
            {onReply && (
              <div className="note-actions">
                <button
                  className="reply-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReply(note.id);
                  }}
                  aria-label={`Reply to note from ${note.coachName}`}
                >
                  Reply
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
