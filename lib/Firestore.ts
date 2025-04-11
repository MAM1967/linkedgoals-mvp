import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Save a check-in to a user's circle
 */
export async function saveCheckin(data: {
  text: string;
  mood: string;
  circle: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");

  const checkin = {
    uid: user.uid,
    text: data.text,
    mood: data.mood,
    circle: data.circle,
    timestamp: serverTimestamp(),
  };

  const ref = collection(db, "users", user.uid, "checkins");
  await addDoc(ref, checkin);
}

