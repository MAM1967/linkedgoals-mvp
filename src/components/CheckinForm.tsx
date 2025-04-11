"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { saveCheckin } from "@/lib/firestore";

const defaultCircles = [
  { label: "Career", emoji: "💼" },
  { label: "Wellness", emoji: "🧘" },
  { label: "Spiritual", emoji: "🙏" },
];

export default function CheckinForm() {
  const [selectedCircle, setSelectedCircle] = useState(defaultCircles[0].label);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<null | "saving" | "success" | "error">(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const user = auth.currentUser;
    if (!user) {
      setStatus("error");
      return console.error("User not signed in.");
    }

    try {
      await saveCheckin(user.uid, selectedCircle, message);
      setStatus("success");
      setMessage("");
    } catch (err) {
      console.error("Error saving check-in:", err);
      setStatus("error");
    }
  };

  return (
    <div className="w-full px-4 pt-6 pb-10 sm:pt-10 sm:pb-16 sm:px-6 md:px-8 max-w-xl mx-auto">
      <div className="bg-white shadow-md rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
          Daily Check-In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select a Circle
            </label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="w-full p-2 sm:p-3 rounded-lg border border-gray-300 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
            >
              {defaultCircles.map(({ label, emoji }) => (
                <option key={label} value={label}>
                  {emoji} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Thoughts
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind today?"
              rows={4}
              className="w-full p-3 rounded-lg border border-gray-300 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full py-2 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 transition"
          >
            {status === "saving" ? "Saving..." : "Submit Check-In"}
          </button>

          {status === "success" && (
            <p className="text-green-600 text-center text-sm">✅ Check-in saved!</p>
          )}
          {status === "error" && (
            <p className="text-red-600 text-center text-sm">❌ Failed to save check-in.</p>
          )}
        </form>
      </div>
    </div>
  );
}
