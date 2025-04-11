// /src/components/Sidebar.tsx

import React from "react";

export default function Sidebar() {
  // Placeholder data; in the future, you'll fetch this from Firestore
  const circles = ["Career", "Wellness", "Spiritual"];

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4 border-r">
      <h2 className="text-xl font-bold mb-4">Your Circles</h2>
      <ul>
        {circles.map((circle, index) => (
          <li key={index} className="mb-2">
            <a href="#" className="text-blue-600 hover:underline">
              {circle}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

