//
//  firebase.ts
//  
//  Multi-environment Firebase configuration
//  Created by Michael McDermott on 4/8/25.
//
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
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
} from "firebase/firestore";

// Environment detection
const getEnvironment = (): string => {
  // Check for build-time environment variable
  if (import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT;
  }
  
  // Check hostname for automatic detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('linkedgoals-dev') || hostname.includes('localhost')) {
      return 'development';
    }
    
    if (hostname.includes('linkedgoals-staging')) {
      return 'staging';
    }
    
    if (hostname.includes('linkedgoals-d7053')) {
      return 'production';
    }
  }
  
  // Default to production for safety
  return 'production';
};

// Environment-specific configurations
const configs = {
  development: {
    apiKey: "YOUR_DEV_API_KEY",
    authDomain: "linkedgoals-dev.firebaseapp.com",
    databaseURL: "https://linkedgoals-dev-default-rtdb.firebaseio.com",
    projectId: "linkedgoals-dev",
    storageBucket: "linkedgoals-dev.firebasestorage.app",
    messagingSenderId: "YOUR_DEV_SENDER_ID",
    appId: "YOUR_DEV_APP_ID",
  },
  staging: {
    apiKey: "YOUR_STAGING_API_KEY",
    authDomain: "linkedgoals-staging.firebaseapp.com",
    databaseURL: "https://linkedgoals-staging-default-rtdb.firebaseio.com",
    projectId: "linkedgoals-staging",
    storageBucket: "linkedgoals-staging.firebasestorage.app",
    messagingSenderId: "YOUR_STAGING_SENDER_ID",
    appId: "YOUR_STAGING_APP_ID",
  },
  production: {
    apiKey: "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
    authDomain: "linkedgoals-d7053.firebaseapp.com",
    databaseURL: "https://linkedgoals-d7053-default-rtdb.firebaseio.com",
    projectId: "linkedgoals-d7053",
    storageBucket: "linkedgoals-d7053.firebasestorage.app",
    messagingSenderId: "753801883214",
    appId: "1:753801883214:web:cf46567024a37452a65d1f",
  }
};

const currentEnvironment = getEnvironment();
const firebaseConfig = configs[currentEnvironment as keyof typeof configs];

console.log(`🔥 Firebase initializing for ${currentEnvironment} environment`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators in development
if (currentEnvironment === 'development' && typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    console.log(`🔧 Connected to Firebase emulators (${currentEnvironment})`);
  } catch (error) {
    console.log("⚠️ Emulators already connected or not available:", error);
  }
}

export { auth, db, functions, currentEnvironment };

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
