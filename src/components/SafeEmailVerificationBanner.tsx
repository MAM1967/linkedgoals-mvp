import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import "./SafeEmailVerificationBanner.css";

interface SafeEmailVerificationBannerProps {
  onResendSuccess?: () => void;
}

export const SafeEmailVerificationBanner: React.FC<
  SafeEmailVerificationBannerProps
> = ({ onResendSuccess }) => {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // Real-time verification status listener
  useEffect(() => {
    if (!user) return;

    console.log(
      "🔍 Setting up real-time verification listener for user:",
      user.uid
    );

    const verificationDocRef = doc(db, "emailVerifications", user.uid);

    const unsubscribe = onSnapshot(
      verificationDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const verified = data.verified || false;
          setIsVerified(verified);
          setDebugInfo(`Firestore verified: ${verified}`);
          console.log("📧 Email verification status updated:", verified);
        } else {
          setIsVerified(false);
          setDebugInfo("No verification doc found");
          console.log("📧 No verification document found");
        }
      },
      (error) => {
        console.error("❌ Error listening to verification status:", error);
        setDebugInfo(`Error: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Don't show banner if user is null, already verified, or manually dismissed
  if (!user || isVerified || !showBanner) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      const response = await fetch(
        "https://us-central1-linkedgoals-d7053.cloudfunctions.net/sendVerificationEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            email: user.email,
            userId: user.uid,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setResendMessage("✅ Verification email sent! Check your inbox.");
        onResendSuccess?.();
      } else {
        setResendMessage(
          "❌ Failed to send verification email. Please try again."
        );
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      setResendMessage("❌ An error occurred. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  const handleManualRefresh = async () => {
    if (!user) return;

    try {
      // Force refresh by calling the verification endpoint
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing verification status:", error);
    }
  };

  return (
    <div className="safe-email-verification-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <span>📧</span>
        </div>
        <div className="banner-text">
          <div className="banner-title">Verify your email address</div>
          <div className="banner-description">
            Please check your email and click the verification link to activate
            all features.
          </div>
          {resendMessage && (
            <div
              className={`banner-message ${
                resendMessage.includes("✅") ? "success" : "error"
              }`}
            >
              {resendMessage}
            </div>
          )}
          {process.env.NODE_ENV === "development" && (
            <div className="debug-info">Debug: {debugInfo}</div>
          )}
        </div>
        <div className="banner-actions">
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="btn-resend"
          >
            {isResending ? "Sending..." : "Resend Email"}
          </button>
          <button
            onClick={handleManualRefresh}
            className="btn-refresh"
            title="Refresh verification status"
          >
            🔄
          </button>
          <button
            onClick={handleDismiss}
            className="btn-dismiss"
            title="Dismiss this notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafeEmailVerificationBanner;
