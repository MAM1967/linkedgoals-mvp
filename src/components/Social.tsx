import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc, // Import doc for updating a document
  updateDoc, // Import updateDoc for updating a document
} from "firebase/firestore";
import { nanoid } from "nanoid"; // Using nanoid for generating unique IDs (you might need to install this: npm install nanoid)

// Define the new structure for the measurable field (consistent with Dashboard.tsx)
interface MeasurableData {
  type: string; // e.g., "Numeric", "Date", "DailyStreak", "Boolean"
  targetValue: number | string | null;
  currentValue: number | string | boolean | null;
  unit?: string; // e.g., "pages", "days", "tasks" - for Numeric type
}

interface SmartGoal {
  id: string;
  specific: string;
  measurable: MeasurableData; // Updated to use the new MeasurableData interface
  achievable: string;
  relevant: string;
  timeBound: string; // Corresponds to overall dueDate in Dashboard's SmartGoal
  userId: string;
  creationDate: string;
  lastUpdatedDate: string;
  isShareable?: boolean; // Add isShareable flag
  sharingId?: string; // Add sharingId field
  category?: string; // Added category
}

const Social: React.FC = () => {
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<SmartGoal | null>(null); // State to hold the selected goal for sharing

  useEffect(() => {
    const fetchSmartGoals = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const goalsRef = collection(db, "goals");
      const q = query(goalsRef, orderBy("creationDate", "desc"));

      const querySnapshot = await getDocs(q);

      const fetchedGoals: SmartGoal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<SmartGoal, "id">; // Ensure data() doesn't conflict with explicit id
        fetchedGoals.push({
          id: doc.id,
          ...data,
        } as SmartGoal); // Cast the final object to SmartGoal
      });

      setSmartGoals(fetchedGoals);
    };

    fetchSmartGoals();
  }, []);

  const handleShareToLinkedIn = () => {
    if (!selectedGoal) {
      alert("Please select a goal to share.");
      return;
    }

    // Constructing sharing content based on the selected goal
    const goalTitle = `SMART Goal Progress: ${selectedGoal.specific}`;
    let goalSummary = `I\'m working on a goal: "${selectedGoal.specific}".\n`;

    // Updated to use new measurable.type values and add DailyStreak
    if (selectedGoal.measurable.type === "Numeric") {
      goalSummary += `Current progress: ${
        selectedGoal.measurable.currentValue ?? "N/A"
      } / ${selectedGoal.measurable.targetValue || "N/A"} ${
        selectedGoal.measurable.unit || ""
      }.\n`;
    } else if (selectedGoal.measurable.type === "Date") {
      goalSummary += `Target completion date: ${
        selectedGoal.measurable.targetValue
          ? new Date(
              selectedGoal.measurable.targetValue as string
            ).toLocaleDateString()
          : "N/A"
      }.\n`;
    } else if (selectedGoal.measurable.type === "Boolean") {
      goalSummary += `Status: ${
        selectedGoal.measurable.currentValue === true
          ? "Completed"
          : "In Progress"
      }.\n`;
    } else if (selectedGoal.measurable.type === "DailyStreak") {
      goalSummary += `Current streak: ${
        selectedGoal.measurable.currentValue ?? "0"
      } / ${selectedGoal.measurable.targetValue || "N/A"} days.\n`;
    }

    goalSummary += `Achievability: ${selectedGoal.achievable}\n`;
    goalSummary += `Relevance: ${selectedGoal.relevant}\n`;
    goalSummary += `Time-bound by: ${new Date(
      selectedGoal.timeBound
    ).toLocaleDateString()}`;

    const appUrl = "YOUR_APP_URL"; // Replace with your application's URL or a specific goal view URL later

    const linkedInShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
      appUrl
    )}&title=${encodeURIComponent(goalTitle)}&summary=${encodeURIComponent(
      goalSummary
    )}`;

    window.open(linkedInShareUrl, "_blank");
  };

  const handleMakeShareable = async () => {
    if (!selectedGoal) {
      alert("Please select a goal to make shareable.");
      return;
    }

    if (selectedGoal.isShareable && selectedGoal.sharingId) {
      // Goal is already shareable, just display the link
      const appBaseUrl = "YOUR_APP_BASE_URL"; // Replace with your application's base URL
      setShareableLink(`${appBaseUrl}/shared-goal/${selectedGoal.sharingId}`);
      return;
    }

    try {
      // Generate a unique sharing ID
      const newSharingId = nanoid(10); // Generates a 10-character unique ID

      // Update the goal document in Firebase
      const goalRef = doc(db, "goals", selectedGoal.id);
      await updateDoc(goalRef, {
        isShareable: true,
        sharingId: newSharingId,
      });

      // Update the local state
      setSelectedGoal({
        ...selectedGoal,
        isShareable: true,
        sharingId: newSharingId,
      });

      // Generate and display the shareable link
      const appBaseUrl = "YOUR_APP_BASE_URL"; // Replace with your application's base URL
      setShareableLink(`${appBaseUrl}/shared-goal/${newSharingId}`);

      alert("Goal is now shareable!");
    } catch (error) {
      console.error("Error making goal shareable:", error);
      alert("An error occurred while making the goal shareable.");
    }
  };

  const [shareableLink, setShareableLink] = useState<string | null>(null); // State to store the shareable link

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h2>Social Screen</h2>

      {/* Goal Selection for Sharing and Watching */}
      <div>
        <h3 className="text-xl font-medium mb-2">Select a Goal to Share</h3>
        {smartGoals.length === 0 ? (
          <p>No SMART goals available to share.</p>
        ) : (
          <select
            className="border rounded p-2"
            onChange={(e) => {
              const goalId = e.target.value;
              const goal = smartGoals.find((g) => g.id === goalId);
              setShareableLink(null); // Clear shareable link when selecting a new goal
              setSelectedGoal(goal || null);
            }}
            value={selectedGoal?.id || ""} // Control the select value
          >
            <option value="" disabled>
              Select a goal
            </option>
            {smartGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.specific}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={handleShareToLinkedIn}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 mr-2"
        disabled={!selectedGoal} // Disable button if no goal is selected
      >
        Share Goal Progress to LinkedIn
      </button>

      {/* Placeholder for Watching and Commenting features */}
      <div className="mt-8 border-t pt-4">
        <button
          onClick={handleMakeShareable}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={!selectedGoal} // Disable button if no goal is selected
        >
          {selectedGoal?.isShareable
            ? "Get Shareable Link"
            : "Make Goal Shareable"}
        </button>

        {/* Display Shareable Link */}
        {shareableLink && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-medium">Shareable Link:</p>
            <a
              href={shareableLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {shareableLink}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(shareableLink)}
              className="ml-2 text-sm text-gray-500 hover:text-gray-700"
            >
              (Copy)
            </button>
          </div>
        )}
        <h3 className="text-xl font-semibold">
          Invite Others to Watch and Comment (Coming Soon)
        </h3>
        <p className="text-gray-600">
          Features for sharing goals with others and enabling comments are under
          development.
        </p>
        {/* We will add UI elements for these features here later */}
      </div>
    </div>
  );
};

export default Social;
