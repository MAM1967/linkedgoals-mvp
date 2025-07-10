//
//  firebase.ts
//
//
//  Created by Michael McDermott on 4/8/25.
//
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  collectionGroup,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "linkedgoals-d7053.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://linkedgoals-d7053-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "linkedgoals-d7053",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "linkedgoals-d7053.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "753801883214",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:753801883214:web:cf46567024a37452a65d1f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Log environment info for debugging
const environment = import.meta.env.VITE_ENVIRONMENT || 'production';
console.log(`🌐 Environment: ${environment}`);
console.log(`🔥 Firebase Project: ${firebaseConfig.projectId}`);

// Connect to emulators if running locally
if (
  typeof window !== "undefined" &&
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log("🔧 Connected to Firebase emulators");
  } catch (error) {
    console.log("⚠️ Emulators already connected or not available:", error);
  }
}

export { auth, db, functions };

// Admin Dashboard Functions
export const getTotalUsers = async () => {
  const usersCollection = collection(db, "users");
  const userSnapshot = await getDocs(usersCollection);
  return userSnapshot.size;
};

export const getNewUsersLast24Hours = async () => {
  const usersCollection = collection(db, "users");
  const twentyFourHoursAgo = Timestamp.fromMillis(
    Date.now() - 24 * 60 * 60 * 1000
  );
  const q = query(
    usersCollection,
    where("createdAt", ">=", twentyFourHoursAgo)
  );
  const userSnapshot = await getDocs(q);
  return userSnapshot.size;
};

export const getTotalGoals = async () => {
  const goalsCollection = collectionGroup(db, "goals");
  const goalSnapshot = await getDocs(goalsCollection);
  return goalSnapshot.size;
};

export const syncAuthUsersToFirestore = async () => {
  try {
    // This would need to be called from a Cloud Function with admin privileges
    // For now, this is a placeholder function structure
    console.log("User sync would happen in Cloud Function with admin SDK");
  } catch (error) {
    console.error("Error syncing users:", error);
  }
};

// Enhanced getUsers function that handles missing data gracefully
export const getUsersWithFallback = async (
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
) => {
  const usersCollection = collection(db, "users");

  // Try the ordered query first
  try {
    const q = query(
      usersCollection,
      orderBy("createdAt", "desc"),
      ...(lastVisible ? [startAfter(lastVisible)] : []),
      limit(10)
    );
    const userSnapshot = await getDocs(q);
    const last = userSnapshot.docs[userSnapshot.docs.length - 1];
    const users = userSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || data.displayName || "Unknown User",
        email: data.email || "No email provided",
        disabled: data.disabled || false,
        createdAt: data.createdAt || { toDate: () => new Date() },
        ...data,
      };
    });
    return { users, last };
  } catch (error) {
    // If ordered query fails, try without ordering
    console.warn(
      "Ordered query failed, falling back to unordered query:",
      error
    );

    const q = query(
      usersCollection,
      limit(10),
      ...(lastVisible ? [startAfter(lastVisible)] : [])
    );
    const userSnapshot = await getDocs(q);
    const last = userSnapshot.docs[userSnapshot.docs.length - 1];
    const users = userSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || data.displayName || "Unknown User",
        email: data.email || "No email provided",
        disabled: data.disabled || false,
        createdAt: data.createdAt || { toDate: () => new Date() },
        ...data,
      };
    });
    return { users, last };
  }
};

// Function to get all users without pagination for debugging
export const getAllUsers = async () => {
  const usersCollection = collection(db, "users");
  const userSnapshot = await getDocs(usersCollection);
  return userSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      fullName: data.fullName || data.displayName || "Unknown User",
      email: data.email || "No email provided",
      disabled: data.disabled || false,
      createdAt: data.createdAt || { toDate: () => new Date() },
      ...data,
    };
  });
};

export default app;
