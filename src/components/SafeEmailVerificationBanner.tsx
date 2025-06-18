import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./SafeEmailVerificationBanner.css";

export const SafeEmailVerificationBanner: React.FC = () => {
  const { user, emailVerificationState, sendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Safe check - only show for unverified users
  if (!user || user.emailVerified) {
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
      </div>
      {message && <div className="banner-message">{message}</div>}
    </div>
  );
};

export default SafeEmailVerificationBanner;
