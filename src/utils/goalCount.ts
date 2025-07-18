import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Get user's current goal count
export async function getUserGoalCount(userId: string): Promise<number> {
  try {
    const goalsRef = collection(db, "goals");
    const q = query(
      goalsRef,
      where("userId", "==", userId),
      where("status", "!=", "archived")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user goal count:", error);
    return 0;
  }
}

// Get user's active goal count (goals that are not completed)
export async function getActiveGoalCount(userId: string): Promise<number> {
  try {
    const goalsRef = collection(db, "goals");
    const q = query(
      goalsRef,
      where("userId", "==", userId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting active goal count:", error);
    return 0;
  }
}

// Update user's goal count in their profile
export async function updateUserGoalCount(
  userId: string,
  newCount: number
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      goalCount: newCount,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating user goal count:", error);
  }
}

// Increment user's goal count (when creating new goal)
export async function incrementUserGoalCount(userId: string): Promise<void> {
  try {
    const currentCount = await getUserGoalCount(userId);
    await updateUserGoalCount(userId, currentCount + 1);
  } catch (error) {
    console.error("Error incrementing user goal count:", error);
  }
}

// Decrement user's goal count (when deleting goal)
export async function decrementUserGoalCount(userId: string): Promise<void> {
  try {
    const currentCount = await getUserGoalCount(userId);
    const newCount = Math.max(0, currentCount - 1); // Ensure count doesn't go below 0
    await updateUserGoalCount(userId, newCount);
  } catch (error) {
    console.error("Error decrementing user goal count:", error);
  }
}

// Get goal count with caching for performance
let goalCountCache: { [userId: string]: { count: number; timestamp: number } } =
  {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedGoalCount(userId: string): Promise<number> {
  const now = Date.now();
  const cached = goalCountCache[userId];

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }

  const count = await getUserGoalCount(userId);
  goalCountCache[userId] = { count, timestamp: now };

  return count;
}

// Clear goal count cache for a user (call when goals are created/deleted)
export function clearGoalCountCache(userId: string): void {
  delete goalCountCache[userId];
}

// Clear all goal count cache
export function clearAllGoalCountCache(): void {
  goalCountCache = {};
}
