import React, { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { useSearchParams } from "react-router-dom";
import "./SafeEmailVerificationBanner.css";

export const SafeEmailVerificationBanner: React.FC = () => {
  const { user, emailVerificationState, sendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [firestoreVerified, setFirestoreVerified] = useState<boolean | null>(
    null
  );
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check Firestore verification status with real-time listener
  useEffect(() => {
    if (!user) {
      setFirestoreVerified(null);
      return;
    }

    console.log("Setting up real-time listener for user:", user.uid);

    const unsubscribe = onSnapshot(
      doc(db, "emailVerifications", user.uid),
      (verificationDoc) => {
        if (verificationDoc.exists()) {
          const data = verificationDoc.data();
          console.log("Real-time verification update:", data);
          setFirestoreVerified(data.verified === true);
        } else {
          console.log("No verification record found");
          setFirestoreVerified(false);
        }
      },
      (error) => {
        console.error("Error in verification listener:", error);
        setFirestoreVerified(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Cleaning up verification listener");
      unsubscribe();
    };
  }, [user]);

  // Manual refresh function
  const manualRefresh = async () => {
    if (!user) return;

    setIsRefreshing(true);
    console.log("🔄 Manual refresh started for user:", user.uid);
    try {
      const verificationDoc = await getDoc(
        doc(db, "emailVerifications", user.uid)
      );
      if (verificationDoc.exists()) {
        const data = verificationDoc.data();
        console.log("📄 Manual refresh data:", data);
        console.log("🔍 Verified status:", data.verified, typeof data.verified);
        setFirestoreVerified(data.verified === true);
      } else {
        console.log("❌ No verification document found");
        setFirestoreVerified(false);
      }
    } catch (error) {
      console.error("💥 Error during manual refresh:", error);
    } finally {
      setIsRefreshing(false);
      console.log("✅ Manual refresh completed");
    }
  };

  // Force refresh when emailVerified parameter is present
  useEffect(() => {
    if (searchParams.get("emailVerified") === "true" && user) {
      console.log("EmailVerified parameter detected, forcing refresh");
      manualRefresh();
    }
  }, [searchParams, user]);

  // Debug: Always show what we're detecting
  console.log("Banner Debug:", {
    user: user?.uid,
    firestoreVerified,
    emailVerificationState,
  });

  // Safe check - only show for unverified users
  if (!user || firestoreVerified === null || firestoreVerified === true) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = await sendVerificationEmail();

    if (result.success) {
      setMessage("Verification email sent! Check your inbox.");
    } else {
      setMessage("Failed to send email. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="safe-email-verification-banner">
      <div className="banner-content">
        <span className="banner-icon">📧</span>
        <div className="banner-text">
          <strong>Please verify your email address</strong>
          <p>Check your inbox for a verification link</p>
        </div>
        <button
          onClick={handleResendEmail}
          disabled={!emailVerificationState.canResend || isLoading}
          className="resend-button"
        >
          {isLoading ? "Sending..." : "Resend"}
        </button>
        <button
          onClick={manualRefresh}
          disabled={isRefreshing}
          className="resend-button refresh-button"
        >
          {isRefreshing ? "Checking..." : "Check Status"}
        </button>
      </div>
      {message && <div className="banner-message">{message}</div>}
    </div>
  );
};

export default SafeEmailVerificationBanner;
