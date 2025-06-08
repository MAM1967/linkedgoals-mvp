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
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
  authDomain: "linkedgoals-d7053.firebaseapp.com",
  databaseURL: "https://linkedgoals-d7053-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-d7053",
  storageBucket: "linkedgoals-d7053.firebasestorage.app",
  messagingSenderId: "753801883214",
  appId: "1:753801883214:web:cf46567024a37452a65d1f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

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

export const getGoals = async (
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
) => {
  // Use a collectionGroup query to get goals from all users
  const goalsCollection = collectionGroup(db, "goals");
  const q = query(
    goalsCollection,
    orderBy("createdAt", "desc"),
    ...(lastVisible ? [startAfter(lastVisible)] : []),
    limit(10)
  );
  const goalSnapshot = await getDocs(q);
  const last = goalSnapshot.docs[goalSnapshot.docs.length - 1];
  const goals = goalSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return { goals, last };
};

export default app;
