import React, { useState } from "react";
import { CoachingNote } from "../types/Dashboard";
import "./CoachNoteInput.css";

interface CoachNoteInputProps {
  goalId: string;
  goalTitle: string;
  coachId: string;
  coachName: string;
  onSubmit: (
    note: Omit<CoachingNote, "id" | "createdAt" | "isRead">
  ) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const CoachNoteInput: React.FC<CoachNoteInputProps> = ({
  goalId,
  goalTitle,
  coachId,
  coachName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<CoachingNote["type"]>("feedback");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!note.trim()) {
      setError("Please enter a note");
      return;
    }

    if (note.trim().length < 10) {
      setError("Note must be at least 10 characters long");
      return;
    }

    try {
      await onSubmit({
        goalId,
        coachId,
        coachName,
        note: note.trim(),
        type: noteType,
      });
      setNote("");
      setNoteType("feedback");
    } catch (err) {
      setError("Failed to save note. Please try again.");
      console.error("Error saving coaching note:", err);
    }
  };

  const noteTypeOptions = [
    {
      value: "feedback",
      label: "📝 Feedback",
      description: "Constructive feedback or suggestions",
    },
    {
      value: "encouragement",
      label: "💪 Encouragement",
      description: "Motivational support",
    },
    {
      value: "suggestion",
      label: "💡 Suggestion",
      description: "Helpful tips or ideas",
    },
    {
      value: "milestone",
      label: "🎯 Milestone",
      description: "Celebrate achievements",
    },
  ];

  const getPlaceholder = () => {
    switch (noteType) {
      case "feedback":
        return "Provide constructive feedback or suggestions for improvement...";
      case "encouragement":
        return "Share encouraging words to motivate progress...";
      case "suggestion":
        return "Offer helpful tips or alternative approaches...";
      case "milestone":
        return "Celebrate achievements and acknowledge progress...";
      default:
        return "Enter your note...";
    }
  };

  return (
    <div className="coach-note-input">
      <div className="coach-note-input__header">
        <h3>Add Coaching Note</h3>
        <p className="goal-context">
          Goal: <strong>{goalTitle}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="coach-note-form">
        {/* Note Type Selection */}
        <div className="form-group">
          <label htmlFor="noteType" className="form-label">
            Note Type
          </label>
          <div className="note-type-options">
            {noteTypeOptions.map((option) => (
              <label
                key={option.value}
                className={`note-type-option ${
                  noteType === option.value ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="noteType"
                  value={option.value}
                  checked={noteType === option.value}
                  onChange={(e) =>
                    setNoteType(e.target.value as CoachingNote["type"])
                  }
                />
                <div className="note-type-content">
                  <span className="note-type-label">{option.label}</span>
                  <span className="note-type-description">
                    {option.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Note Content */}
        <div className="form-group">
          <label htmlFor="noteContent" className="form-label">
            Note Content
          </label>
          <textarea
            id="noteContent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={getPlaceholder()}
            className="note-textarea"
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="character-count">{note.length}/500 characters</div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <span className="icon">💬</span>
                Add Note
              </>
            )}
          </button>
        </div>
      </form>

      {/* Coach Info */}
      <div className="coach-info">
        <span className="coach-label">Coach:</span>
        <span className="coach-name">{coachName}</span>
      </div>
    </div>
  );
};
