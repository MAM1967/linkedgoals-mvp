"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  DocumentData, // Import DocumentData for type hinting
} from "firebase/firestore";

interface SmartGoal {
  id: string;
  specific: string;
  measurable: {
    type: string;
    targetValue: number | string | boolean | null;
    currentValue: number | string | boolean | null;
  };
  achievable: string;
  relevant: string;
  timeBound: string;
  userId: string;
  creationDate: string;
  lastUpdatedDate: string;
}

export default function Dashboard() {
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);

  useEffect(() => {
    const fetchSmartGoals = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch from the 'goals' collection
      const goalsRef = collection(db, "goals");
      // You might want to add a query to filter goals by user ID here later
      // For now, let's fetch all goals (assuming goals are user-specific based on saveSmartGoal function)
      const q = query(goalsRef, orderBy("creationDate", "desc")); // Order by creation date

      const querySnapshot = await getDocs(q);

      const fetchedGoals: SmartGoal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SmartGoal; // Cast data to SmartGoal interface
        fetchedGoals.push({
          id: doc.id,
          ...data, // Spread the data properties
        });
      });

      setSmartGoals(fetchedGoals);
    };

    fetchSmartGoals();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6"> {/* Increased padding and spacing */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Your SMART Goals</h2> {/* Larger, bolder heading */}
      {smartGoals.length === 0 && <p className="text-center text-gray-500">No SMART goals yet. Start by adding a new goal!</p>} {/* Centered message */}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1"> {/* Grid layout for potential future use, currently single column */}
        {smartGoals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg shadow-md overflow-hidden"> {/* Card styling */}
            <div className="p-6"> {/* Inner padding */}
              <h3 className="font-semibold text-xl text-gray-900 mb-3">{goal.specific}</h3> {/* Goal specific statement */}

              <div className="space-y-2 text-gray-700 text-base"> {/* Spacing and text size for details */}
                {/* Measurable */}
                <div>
                  <p className="font-medium text-gray-800">Measurable ({goal.measurable.type}):</p>
                  {goal.measurable.type === 'Number' && (
                      <div>
                        <p className="ml-2">Target: <span className="font-semibold">{goal.measurable.targetValue}</span> | Current: <span className="font-semibold">{goal.measurable.currentValue}</span></p>
                        {/* Progress Bar Container */}
                        {goal.measurable.targetValue !== null && goal.measurable.currentValue !== null && typeof goal.measurable.targetValue === 'number' && typeof goal.measurable.currentValue === 'number' && goal.measurable.targetValue > 0 && (
                           <div className="w-full bg-gray-200 rounded-full h-3 mt-2"> {/* Increased height */}
                             <div
                               className="bg-blue-600 h-3 rounded-full text-xs text-white text-center transition-all duration-500 ease-in-out" // Added text styling and transition
                               style={{ width: `${Math.min((goal.measurable.currentValue / goal.measurable.targetValue) * 100, 100)}%` }}
                             >
                               {/* Display percentage if progress is visible */}
                                {Math.min((goal.measurable.currentValue / goal.measurable.targetValue) * 100, 100).toFixed(0)}%
                             </div>
                           </div>
                         )}
                         {/* Handle case where target is 0 or null */}
                         {goal.measurable.type === 'Number' && (goal.measurable.targetValue === 0 || goal.measurable.targetValue === null) && (
                            <p className="ml-2 text-gray-500">Target not set or is 0.</p>
                          )}
                      </div>
                    )}
                    {goal.measurable.type === 'Date' && (
                       <p className="ml-2">Target: <span className="font-semibold">{new Date(goal.measurable.targetValue as string).toLocaleDateString()}</span> | Current: <span className="font-semibold">{new Date(goal.measurable.currentValue as string).toLocaleDateString()}</span></p>
                    )}
                    {goal.measurable.type === 'Yes/No' && (
                       <p className="ml-2">Status: <span className="font-semibold">{goal.measurable.currentValue === true ? 'Completed' : 'In Progress'}</span></p>
                    )}
                </div>

                {/* Achievable */}
                <div>
                  <p className="font-medium text-gray-800">Achievable:</p>
                  <p className="ml-2">{goal.achievable}</p>
                </div>

                {/* Relevant */}
                <div>
                   <p className="font-medium text-gray-800">Relevant:</p>
                  <p className="ml-2">{goal.relevant}</p>
                </div>

                {/* Time-bound */}
                <div>
                   <p className="font-medium text-gray-800">Time-bound:</p>
                  <p className="ml-2"><span className="font-semibold">{new Date(goal.timeBound).toLocaleDateString()}</span></p>
                </div>

                 {/* Created and Last Updated Dates (Optional - uncomment if needed) */}
                 {/*
                 <div>
                    <p className="font-medium text-gray-800">Created:</p>
                   <p className="ml-2 text-xs text-gray-500">{new Date(goal.creationDate).toLocaleString()}</p>
                 </div>
                 <div>
                    <p className="font-medium text-gray-800">Last Updated:</p>
                   <p className="ml-2 text-xs text-gray-500">{new Date(goal.lastUpdatedDate).toLocaleString()}</p>
                 </div>
                 */}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
