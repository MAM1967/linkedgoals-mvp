import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthUser extends User {
  isAdmin?: boolean;
  customEmailVerified?: boolean;
  emailVerificationDate?: Date;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          let isAdmin = false;
          let customEmailVerified = false;
          let emailVerificationDate = undefined;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            isAdmin = userData.role === "admin";
            customEmailVerified = userData.emailVerified || false;
            emailVerificationDate = userData.emailVerificationDate?.toDate();
          }

          setUser({
            ...currentUser,
            isAdmin,
            customEmailVerified,
            emailVerificationDate,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
