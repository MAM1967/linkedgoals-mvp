import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
export async function saveCheckin(userId, data) {
    const ref = collection(db, "users", userId, "checkins");
    const checkinRef = await addDoc(ref, {
        circle: data.circle,
        message: data.message,
        createdAt: serverTimestamp(),
    });
    if (data.goal) {
        const goalRef = collection(checkinRef, "goal");
        await addDoc(goalRef, {
            ...data.goal,
            createdAt: serverTimestamp(),
        });
    }
}
