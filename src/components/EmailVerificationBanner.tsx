import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./EmailVerificationBanner.css";

interface EmailVerificationBannerProps {
  onResendSuccess?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  onResendSuccess,
}) => {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [showBanner, setShowBanner] = useState(true);

  // Don't show banner if email is already verified or user is not available
  if (!user || user.customEmailVerified || !showBanner) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      // Call the Firebase function to resend verification email
      const functionsBaseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL || "https://us-central1-linkedgoals-d7053.cloudfunctions.net";
      const response = await fetch(
        `${functionsBaseUrl}/sendVerificationEmail`,
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

  return (
    <div className="email-verification-banner">
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

export default EmailVerificationBanner;
