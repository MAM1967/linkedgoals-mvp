import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export const checkAndSetupAdminUser = async (uid: string, email: string) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create the user document with admin role
      await setDoc(userDocRef, {
        uid: uid,
        email: email,
        fullName: "Admin User",
        displayName: "Admin User",
        role: "admin",
        createdAt: serverTimestamp(),
        disabled: false,
        emailVerified: true,
      });
      console.log("✅ Admin user document created in Firestore");
      return true;
    } else {
      const userData = userDoc.data();
      if (userData.role !== "admin") {
        // Update existing user to have admin role
        await setDoc(
          userDocRef,
          {
            ...userData,
            role: "admin",
          },
          { merge: true }
        );
        console.log("✅ User updated to admin role in Firestore");
        return true;
      }
      console.log("✅ Admin user already properly configured");
      return true;
    }
  } catch (error) {
    console.error("❌ Error setting up admin user:", error);
    return false;
  }
};

// Function to check if user is admin
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === "admin";
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
