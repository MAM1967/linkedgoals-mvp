import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./EmailVerification.css";

const EmailVerificationSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // Auto-redirect to dashboard after countdown
      window.location.href = "/";
    }
  }, [success, countdown]);

  if (!success) {
    return (
      <div className="email-verification-container">
        <div className="email-verification-card error">
          <div className="icon-container error">
            <span className="icon">❌</span>
          </div>
          <h1>Verification Failed</h1>
          <p>We couldn't verify your email address. This could be because:</p>
          <ul className="error-reasons">
            <li>The verification link has expired</li>
            <li>The link has already been used</li>
            <li>The link is invalid or corrupted</li>
          </ul>
          <div className="action-buttons">
            <Link to="/login" className="btn btn-secondary">
              Back to Login
            </Link>
            <Link to="/" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-verification-container">
      <div className="email-verification-card success">
        <div className="icon-container success">
          <span className="icon">✅</span>
        </div>
        <h1>Email Verified Successfully!</h1>
        <p>
          Congratulations! Your email address has been verified and your account
          is now fully activated.
        </p>

        <div className="benefits-list">
          <h3>You can now:</h3>
          <ul>
            <li>✅ Access all LinkedGoals features</li>
            <li>📊 Track your professional goals</li>
            <li>📧 Receive weekly progress updates</li>
            <li>🎯 Get personalized insights</li>
          </ul>
        </div>

        <div className="auto-redirect">
          <p>Redirecting to your dashboard in {countdown} seconds...</p>
          <div className="countdown-bar">
            <div
              className="countdown-progress"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            <span className="btn-icon">→</span>
            Go to Dashboard Now
          </Link>
        </div>

        <div className="help-text">
          <p>
            Need help? Contact us at{" "}
            <a href="mailto:support@linkedgoals.app">support@linkedgoals.app</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSuccess;
