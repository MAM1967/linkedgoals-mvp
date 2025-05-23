"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { saveCheckin } from "@/lib/firestore";
import { CheckinData } from "@/types";

console.log("🧠 Using the NEW CheckinForm with dropdowns!");

type CheckinFormProps = {
  goals: { id: string; name: string }[];
  onCheckinSaved?: () => void;
};

const defaultCircles = [
  { name: "Career", icon: "🏆" },
  { name: "Leadership", icon: "🧠" },
  { name: "Productivity", icon: "⚙️" },
];

export default function CheckinForm({
  goals,
  onCheckinSaved,
}: CheckinFormProps) {
  const [selectedCircle, setSelectedCircle] = useState(defaultCircles[0].name);
  const [message, setMessage] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDueDate, setGoalDueDate] = useState("");
  const [goalComplete, setGoalComplete] = useState(false);
  const [status, setStatus] = useState<null | "saving" | "success" | "error">(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const user = auth.currentUser;
    if (!user) {
      setStatus("error");
      return console.error("User not signed in.");
    }

    const selectedGoal = goals.find((g) => g.id === selectedGoalId);

    const data: CheckinData = {
      circle: selectedCircle,
      message,
      goalId: selectedGoal?.id || null,
      goal: selectedGoal
        ? {
            name: selectedGoal.name,
            description: goalDescription,
            dueDate: goalDueDate || undefined,
            completed: goalComplete,
          }
        : undefined,
    };

    try {
      await saveCheckin(user.uid, data);
      setStatus("success");
      setMessage("");
      setSelectedGoalId("");
      setGoalDescription("");
      setGoalDueDate("");
      setGoalComplete(false);
      if (onCheckinSaved) onCheckinSaved();
    } catch (err) {
      console.error("Error saving check-in:", err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold">Daily Check-In</h2>

      <select
        value={selectedCircle}
        onChange={(e) => setSelectedCircle(e.target.value)}
        className="w-full p-2 border rounded"
      >
        {defaultCircles.map(({ name, icon }) => (
          <option key={name} value={name}>
            {icon} {name}
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind today?"
        rows={4}
        className="w-full p-2 border rounded"
        required
      />

      <div className="bg-gray-50 p-3 rounded border">
        <h3 className="font-medium">Link to a Goal (optional)</h3>
        <select
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        >
          <option value="">None</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              🎯 {goal.name}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Describe your progress or criteria"
          value={goalDescription}
          onChange={(e) => setGoalDescription(e.target.value)}
          rows={2}
          className="w-full p-2 border rounded mt-2"
        />
        <input
          type="date"
          value={goalDueDate}
          onChange={(e) => setGoalDueDate(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        />
        <label className="flex items-center mt-2">
          <input
            type="checkbox"
            checked={goalComplete}
            onChange={(e) => setGoalComplete(e.target.checked)}
            className="mr-2"
          />
          Mark as completed
        </label>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {status === "saving" ? "Saving..." : "Submit Check-In"}
      </button>

      {status === "success" && (
        <p className="text-green-600">Check-in saved!</p>
      )}
      {status === "error" && (
        <p className="text-red-600">Failed to save check-in.</p>
      )}
    </form>
  );
}
