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
import { firebaseConfig, currentEnvironment } from "../config";

console.log(`🔧 Using Firebase environment: ${currentEnvironment}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

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

export const getUsers = async (
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
) => {
  const usersCollection = collection(db, "users");
  const q = query(
    usersCollection,
    orderBy("createdAt", "desc"),
    ...(lastVisible ? [startAfter(lastVisible)] : []),
    limit(10)
  );
  const userSnapshot = await getDocs(q);
  const last = userSnapshot.docs[userSnapshot.docs.length - 1];
  const users = userSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return { users, last };
};

export default app;
