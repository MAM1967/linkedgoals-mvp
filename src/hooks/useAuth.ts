import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../lib/firebase";

interface AuthUser extends User {
  isAdmin?: boolean;
}

interface EmailVerificationState {
  canResend: boolean;
  lastSentTime: Date | null;
  resendCooldown: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationState, setEmailVerificationState] =
    useState<EmailVerificationState>({
      canResend: true,
      lastSentTime: null,
      resendCooldown: 0,
    });

  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
        // Force re-evaluation of auth state
      } catch (error) {
        console.error("Error reloading user:", error);
      }
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser || !emailVerificationState.canResend) {
      console.error("Cannot send verification email:", {
        hasUser: !!auth.currentUser,
        canResend: emailVerificationState.canResend,
        userEmail: auth.currentUser?.email,
      });
      return { success: false, error: "Cannot send verification email" };
    }

    try {
      console.log(
        "Attempting to send verification email to:",
        auth.currentUser.email
      );

      // Use your custom Resend-based Cloud Function instead of Firebase default
      const sendEmailFunction = httpsCallable(
        functions,
        "sendVerificationEmail"
      );

      await sendEmailFunction({
        email: auth.currentUser.email,
        userId: auth.currentUser.uid,
      });

      console.log("Verification email sent successfully via Resend");

      setEmailVerificationState({
        canResend: false,
        lastSentTime: new Date(),
        resendCooldown: 60,
      });

      setTimeout(() => {
        setEmailVerificationState((prev) => ({
          ...prev,
          canResend: true,
          resendCooldown: 0,
        }));
      }, 60000);

      return { success: true };
    } catch (error) {
      console.error("Error sending verification email:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }, [emailVerificationState.canResend]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setUser({ ...currentUser, isAdmin: true });
          } else {
            setUser(currentUser);
          }
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

  return {
    user,
    loading,
    emailVerificationState,
    reloadUser,
    sendVerificationEmail,
  };
}
