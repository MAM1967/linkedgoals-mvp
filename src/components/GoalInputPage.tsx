import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase"; // Corrected path
import "./GoalInputPage.css"; // We will create this CSS file

const GoalInputPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [goalDescription, setGoalDescription] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [dueDate, setDueDate] = useState(""); // Store as string from date input

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalSteps = 6; // Description + S + M + A + R + T (DueDate)

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isValidDateString = (dateString: string): string | false => {
    let normalizedDateString = dateString;

    // Regex for YYYY-MM-DD
    const ymdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    // Regex for MM/DD/YYYY
    const mdyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (ymdRegex.test(normalizedDateString)) {
      // Already in YYYY-MM-DD, proceed with deeper validation
    } else if (mdyRegex.test(normalizedDateString)) {
      // Attempt to convert MM/DD/YYYY to YYYY-MM-DD
      const parts = normalizedDateString.match(mdyRegex);
      if (parts) {
        normalizedDateString = `${parts[3]}-${parts[1]}-${parts[2]}`;
      } else {
        return false; // Should not happen if regex test passed
      }
    } else {
      return false; // Not a recognized format
    }

    // Now, normalizedDateString should be YYYY-MM-DD or the original if it was already YYYY-MM-DD
    // Further check if it forms a valid date object (e.g., not 2023-02-30)
    // And ensure the re-normalized string still matches YYYY-MM-DD strictly
    if (!ymdRegex.test(normalizedDateString)) return false;

    const date = new Date(normalizedDateString + "T00:00:00"); // Add time to avoid timezone issues with just date
    const [year, month, day] = normalizedDateString.split("-").map(Number);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return normalizedDateString; // Return the validated and potentially normalized YYYY-MM-DD string
    } else {
      return false;
    }
  };

  const handleSaveGoal = async () => {
    setError(null);
    setSuccess(null);
    if (!auth.currentUser) {
      setError("You must be logged in to save a goal.");
      return;
    }

    if (
      !goalDescription.trim() ||
      !specific.trim() ||
      !measurable.trim() ||
      !achievable.trim() ||
      !relevant.trim() ||
      !dueDate.trim() // also trim dueDate before validation
    ) {
      setError("Please fill out all fields before saving.");
      return;
    }

    const validatedDate = isValidDateString(dueDate.trim());

    if (!validatedDate) {
      setError(
        "Invalid due date. Please ensure you have selected a valid date (e.g., YYYY-MM-DD or MM/DD/YYYY)."
      );
      return;
    }

    try {
      const goalsCollectionRef = collection(
        db,
        `users/${auth.currentUser.uid}/goals`
      );
      await addDoc(goalsCollectionRef, {
        description: goalDescription,
        specific,
        measurable,
        achievable,
        relevant,
        dueDate: validatedDate, // Use the validated and potentially normalized date
        createdAt: serverTimestamp(),
        status: "active",
        completed: false,
      });
      setSuccess("Goal saved successfully!");
      setGoalDescription("");
      setSpecific("");
      setMeasurable("");
      setAchievable("");
      setRelevant("");
      setDueDate(""); // Reset to empty string for the input field
      setCurrentStep(1);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to save goal. Please try again.");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <label htmlFor="goalDescription">Goal Description:</label>
            <textarea
              id="goalDescription"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="What is the overall goal you want to achieve?"
            />
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <label htmlFor="specific">Specific:</label>
            <textarea
              id="specific"
              value={specific}
              onChange={(e) => setSpecific(e.target.value)}
              placeholder="What exactly do you want to achieve? Be precise."
            />
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <label htmlFor="measurable">Measurable:</label>
            <textarea
              id="measurable"
              value={measurable}
              onChange={(e) => setMeasurable(e.target.value)}
              placeholder="How will you measure progress and know when it's achieved?"
            />
          </div>
        );
      case 4:
        return (
          <div className="form-step">
            <label htmlFor="achievable">Achievable:</label>
            <textarea
              id="achievable"
              value={achievable}
              onChange={(e) => setAchievable(e.target.value)}
              placeholder="Is this goal realistic and attainable for you? How?"
            />
          </div>
        );
      case 5:
        return (
          <div className="form-step">
            <label htmlFor="relevant">Relevant:</label>
            <textarea
              id="relevant"
              value={relevant}
              onChange={(e) => setRelevant(e.target.value)}
              placeholder="Why is this goal important to you? Does it align with other objectives?"
            />
          </div>
        );
      case 6:
        return (
          <div className="form-step">
            <label htmlFor="dueDate">Time-bound (Due Date):</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate} // This should be YYYY-MM-DD for the input to be controlled correctly if possible
              onChange={(e) => setDueDate(e.target.value)} // e.target.value is what we get
              placeholder="YYYY-MM-DD or MM/DD/YYYY"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="goal-input-page">
      <h2>
        Create New SMART Goal ({currentStep}/{totalSteps})
      </h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <form onSubmit={(e) => e.preventDefault()} className="goal-input-form">
        {renderStep()}
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="btn btn-secondary"
            >
              Previous
            </button>
          )}
          {currentStep < totalSteps && (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary"
            >
              Next
            </button>
          )}
          {currentStep === totalSteps && (
            <button
              type="button"
              onClick={handleSaveGoal}
              className="btn btn-success"
            >
              Save Goal
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GoalInputPage;
