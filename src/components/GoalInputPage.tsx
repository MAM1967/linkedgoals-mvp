import React, { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase"; // Corrected path
import Tooltip from "./common/Tooltip"; // Import Tooltip
import TemplateSelector from "./TemplateSelector"; // Import Template Selector
import { GoalTemplate } from "../types/GoalTemplates"; // Import Template type
import { usePlanLimits } from "../hooks/usePlanLimits";
import { GoalLimitReached } from "./freemium/GoalLimitReached";
import "./GoalInputPage.css"; // We will create this CSS file

// Define the allowed categories for the MVP
const MVP_CATEGORIES = ["Career", "Productivity", "Skills"];

// Define the new structure for the measurable field (consistent with other files)
interface MeasurableData {
  type: string;
  targetValue: number | string | null;
  currentValue: number | string | boolean | null;
  unit?: string;
}

const MEASURABLE_TYPES = [
  { value: "Numeric", label: "Numeric (e.g., count, pages, hours)" },
  { value: "Date", label: "Target Date" },
  { value: "DailyStreak", label: "Daily Check-in Streak" },
  { value: "Boolean", label: "Done / Not Done" },
];

const GoalInputPage: React.FC = () => {
  const { goalCount, canCreateGoal } = usePlanLimits();
  const [currentStep, setCurrentStep] = useState(0); // Start with template selection
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(
    null
  );
  const [goalDescription, setGoalDescription] = useState("");
  const [category, setCategory] = useState<string>(MVP_CATEGORIES[0]); // New state for category, default to first
  const [specific, setSpecific] = useState("");

  // State for the structured measurable field
  const [measurableType, setMeasurableType] = useState<string>(
    MEASURABLE_TYPES[0].value
  );
  const [measurableTarget, setMeasurableTarget] = useState<string>(""); // Generic string for input, convert later
  const [measurableUnit, setMeasurableUnit] = useState<string>(""); // e.g., pages, days

  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [dueDate, setDueDate] = useState(""); // Store as string from date input

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalSteps = 7; // Description + Category + S + M + A + R + T (DueDate)

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Template selection handlers
  const handleTemplateSelection = (template: GoalTemplate) => {
    setSelectedTemplate(template);

    // Pre-fill form with template data
    setGoalDescription(template.description);
    setCategory(template.category);
    setSpecific(template.smartFramework.specific);
    setMeasurableType(template.smartFramework.measurable.type);
    setMeasurableTarget(
      template.smartFramework.measurable.suggestedTarget?.toString() || ""
    );
    setMeasurableUnit(template.smartFramework.measurable.unit || "");
    setAchievable(template.smartFramework.achievable);
    setRelevant(template.smartFramework.relevant);

    // Set suggested due date
    const suggestedDueDate = new Date();
    suggestedDueDate.setDate(
      suggestedDueDate.getDate() + template.smartFramework.suggestedDuration
    );
    setDueDate(suggestedDueDate.toISOString().split("T")[0]);

    setCurrentStep(1); // Move to first SMART step
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setCurrentStep(1); // Move to first SMART step
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

    // Check freemium limits before saving
    const limitValidation = canCreateGoal();
    if (!limitValidation.allowed) {
      setError(limitValidation.reason || "You've reached your goal limit.");
      return;
    }

    // Basic validation for all fields including measurable parts based on type
    let measurableDataError = false;
    if (
      measurableType === "Numeric" &&
      (!measurableTarget.trim() || !measurableUnit.trim())
    )
      measurableDataError = true;
    if (measurableType === "Date" && !measurableTarget.trim())
      measurableDataError = true;
    if (measurableType === "DailyStreak" && !measurableTarget.trim())
      measurableDataError = true;
    // Boolean type needs no extra validation for measurable target/unit

    if (
      !goalDescription.trim() ||
      !specific.trim() ||
      measurableDataError || // Check our flag
      !achievable.trim() ||
      !relevant.trim() ||
      !dueDate.trim() ||
      !category // Ensure category is selected
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

    let currentVal: number | string | boolean | null = null;
    let targetVal: number | string | null = null;

    switch (measurableType) {
      case "Numeric": {
        targetVal = parseFloat(measurableTarget);
        if (isNaN(targetVal)) {
          setError("Numeric target value must be a number.");
          return;
        }
        currentVal = 0; // Default current value for numeric
        break;
      }
      case "Date": {
        const validatedMeasurableDate = isValidDateString(
          measurableTarget.trim()
        );
        if (!validatedMeasurableDate) {
          setError("Invalid target date for 'Measurable' field.");
          return;
        }
        targetVal = validatedMeasurableDate; // Now definitely a string
        currentVal = null; // Or perhaps today's date string if needed for comparison later
        break;
      }
      case "DailyStreak": {
        targetVal = parseInt(measurableTarget, 10);
        if (isNaN(targetVal) || targetVal <= 0) {
          setError("Daily streak target must be a positive number of days.");
          return;
        }
        currentVal = 0; // Default current streak
        break;
      }
      case "Boolean": {
        targetVal = null; // No specific target value for boolean
        currentVal = false; // Default to not done
        break;
      }
      default:
        setError("Invalid measurable type selected.");
        return;
    }

    // Define a clear type for the object to be saved to Firestore
    interface GoalToSave {
      description: string;
      specific: string;
      measurable: MeasurableData; // Structured measurable data
      achievable: string;
      relevant: string;
      dueDate: string; // Overall goal due date
      category: string;
      createdAt: FieldValue; // Correct type for serverTimestamp
      status: string;
      completed: boolean;
    }

    const goalDataToSave: GoalToSave = {
      description: goalDescription,
      specific,
      measurable: {
        type: measurableType,
        targetValue: targetVal,
        currentValue: currentVal,
        ...(measurableType === "Numeric" &&
          measurableUnit.trim() && { unit: measurableUnit.trim() }),
      },
      achievable,
      relevant,
      dueDate: validatedDate,
      category: category,
      createdAt: serverTimestamp(),
      status: "active",
      completed: false,
    };

    try {
      const goalsCollectionRef = collection(
        db,
        `users/${auth.currentUser.uid}/goals`
      );
      await addDoc(goalsCollectionRef, goalDataToSave);
      setSuccess("Goal saved successfully!");
      setGoalDescription("");
      setCategory(MVP_CATEGORIES[0]); // Reset category
      setSpecific("");
      setMeasurableType(MEASURABLE_TYPES[0].value);
      setMeasurableTarget("");
      setMeasurableUnit("");
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
      case 0: {
        return (
          <TemplateSelector
            onSelectTemplate={handleTemplateSelection}
            onCreateFromScratch={handleCreateFromScratch}
          />
        );
      }
      case 1: {
        return (
          <div className="form-step">
            <label htmlFor="goalDescription">Goal Description:</label>
            <textarea
              id="goalDescription"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="e.g., I want to become a better public speaker"
            />
          </div>
        );
      }
      case 2: {
        return (
          <div className="form-step">
            <label htmlFor="category">Category:</label>
            <Tooltip
              text="Choose from Career, Productivity, or Skills for better organization"
              position="right"
            >
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {MVP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Tooltip>
          </div>
        );
      }
      case 3: {
        return (
          <div className="form-step">
            <label htmlFor="specific">Specific:</label>
            <Tooltip
              text="Be clear and precise about what you want to achieve"
              position="right"
            >
              <textarea
                id="specific"
                value={specific}
                onChange={(e) => setSpecific(e.target.value)}
                placeholder="What exactly do you want to achieve? Be precise."
              />
            </Tooltip>
          </div>
        );
      }
      case 4: {
        return (
          <div className="form-step">
            <label>Measurable</label>
            <Tooltip
              text="Choose how you'll track progress: Numeric, Date, Streak, or Done/Not Done"
              position="right"
            >
              <select
                value={measurableType}
                onChange={(e) => {
                  setMeasurableType(e.target.value);
                  setMeasurableTarget(""); // Reset target and unit on type change
                  setMeasurableUnit("");
                }}
              >
                {MEASURABLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Tooltip>

            <Tooltip
              text="Set your target value and measurement unit"
              position="right"
            >
              <div>
                {measurableType === "Numeric" && (
                  <>
                    <input
                      type="number"
                      value={measurableTarget}
                      onChange={(e) => setMeasurableTarget(e.target.value)}
                      placeholder="e.g., 10"
                    />
                    <input
                      type="text"
                      value={measurableUnit}
                      onChange={(e) => setMeasurableUnit(e.target.value)}
                      placeholder="Unit (e.g., chapters, tasks)"
                    />
                  </>
                )}
                {measurableType === "Date" && (
                  <input
                    type="date"
                    value={measurableTarget}
                    onChange={(e) => setMeasurableTarget(e.target.value)}
                  />
                )}
                {measurableType === "DailyStreak" && (
                  <input
                    type="number"
                    value={measurableTarget}
                    onChange={(e) => setMeasurableTarget(e.target.value)}
                    placeholder="Target streak (e.g., 30 days)"
                  />
                )}
              </div>
            </Tooltip>
          </div>
        );
      }
      case 5: {
        return (
          <div className="form-step">
            <label htmlFor="achievable">Achievable:</label>
            <Tooltip
              text="Ensure your goal is realistic and attainable given your resources"
              position="right"
            >
              <textarea
                id="achievable"
                value={achievable}
                onChange={(e) => setAchievable(e.target.value)}
                placeholder="Is this goal realistic and attainable for you? How?"
              />
            </Tooltip>
          </div>
        );
      }
      case 6: {
        return (
          <div className="form-step">
            <label htmlFor="relevant">Relevant:</label>
            <Tooltip
              text="Explain why this goal matters to you and aligns with your values"
              position="right"
            >
              <textarea
                id="relevant"
                value={relevant}
                onChange={(e) => setRelevant(e.target.value)}
                placeholder="Why is this goal important to you? Does it align with other objectives?"
              />
            </Tooltip>
          </div>
        );
      }
      case 7: {
        return (
          <div className="form-step">
            <label htmlFor="dueDate">Time-bound (Due Date):</label>
            <Tooltip
              text="Set a specific deadline to create urgency and focus"
              position="right"
            >
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </Tooltip>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Check if user has reached goal limit
  const limitValidation = canCreateGoal();
  const hasReachedLimit = !limitValidation.allowed;

  return (
    <div className="goal-input-page">
      {currentStep > 0 && (
        <>
          <h2>
            {selectedTemplate
              ? `Create Goal: ${selectedTemplate.name}`
              : "Create New SMART Goal"}{" "}
            ({currentStep}/{totalSteps})
          </h2>
          {selectedTemplate && (
            <p className="template-indicator">
              📋 Using {selectedTemplate.category} template •{" "}
              {selectedTemplate.difficulty} level
            </p>
          )}
        </>
      )}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Show goal limit reached component if user can't create more goals */}
      {hasReachedLimit ? (
        <GoalLimitReached
          currentCount={goalCount}
          onUpgradeClick={() => {
            // TODO: Navigate to premium signup
            alert("Premium upgrade coming soon!");
          }}
          onWaitlistClick={() => {
            // TODO: Add to waitlist
            alert("Waitlist signup coming soon!");
          }}
        />
      ) : (
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
      )}
    </div>
  );
};

export default GoalInputPage;
