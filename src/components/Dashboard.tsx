"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

interface Goal {
  name: string;
  description: string;
  dueDate?: string;
  completed: boolean;
}

interface Checkin {
  id: string;
  circle: string;
  message: string;
  createdAt: any;
  goal?: Goal;
}

export default function Dashboard() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    const fetchCheckins = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = collection(db, "users", user.uid, "checkins");
      const q = query(ref, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const results: Checkin[] = [];

      for (const docSnap of snap.docs) {
        const base = docSnap.data();
        const goalRef = collection(docSnap.ref, "goal");
        const goalSnap = await getDocs(goalRef);

        let goal: Goal | undefined = undefined;
        if (!goalSnap.empty) {
          goal = goalSnap.docs[0].data() as Goal;
        }

        results.push({
          id: docSnap.id,
          circle: base.circle,
          message: base.message,
          createdAt: base.createdAt,
          goal,
        });
      }

      setCheckins(results);
    };

    fetchCheckins();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Your Progress</h2>
      {checkins.length === 0 && <p>No check-ins yet.</p>}

      {checkins.map((entry) => (
        <div key={entry.id} className="border p-4 rounded bg-white shadow-sm">
          <p className="text-sm text-gray-500">
            {entry.circle} –{" "}
            {entry.createdAt?.toDate
              ? entry.createdAt.toDate().toLocaleDateString()
              : "No date"}
          </p>
          <p className="mt-1">{entry.message}</p>

          {entry.goal && (
            <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3">
              <p className="font-medium">🎯 Goal: {entry.goal.name}</p>
              {entry.goal.description && (
                <p className="text-sm text-gray-700">{entry.goal.description}</p>
              )}
              {entry.goal.dueDate && (
                <p className="text-xs text-gray-500">
                  Due: {new Date(entry.goal.dueDate).toLocaleDateString()}
                </p>
              )}
              {entry.goal.completed && (
                <p className="text-green-600 text-sm mt-1 font-medium">
                  ✅ Completed
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

