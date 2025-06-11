import React from "react";
import "./CoachOnboardingPage.css";

const CoachOnboardingDemo: React.FC = () => {
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", color: "#333" }}>
        Coach Onboarding Page - All States Preview
      </h1>

      {/* State 1: Loading */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          1. Loading State
        </h2>
        <div className="coach-onboarding-container">
          <p>Loading invitation...</p>
        </div>
      </div>

      {/* State 2: Invalid Link */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          2. Invalid/Missing Parameters
        </h2>
        <div className="coach-onboarding-container">
          <h1>Coach Onboarding</h1>
          <p className="error-message">
            Invalid or incomplete invitation link. Please ensure you have the
            correct link from the inviter.
          </p>
        </div>
      </div>

      {/* State 3: Welcome Screen (Not Authenticated) */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          3. Welcome Screen (User Not Logged In)
        </h2>
        <div className="coach-onboarding-container">
          <h1>Coach Onboarding</h1>
          <p>
            Welcome! <strong>Sarah Johnson</strong> has invited you to be their
            accountability coach for the goal:
            <br />
            <em>"Complete my MBA degree by December 2024"</em>
          </p>
          <p>
            To accept this invitation, please sign in or sign up with LinkedIn.
          </p>
          <div className="login-action-area">
            <div
              style={{
                padding: "20px",
                border: "1px solid #0077B5",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0", color: "#666" }}>
                [LinkedIn Login Button Would Appear Here]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* State 4: Processing */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          4. Processing/Verification State
        </h2>
        <div className="coach-onboarding-container">
          <h1>Coach Onboarding</h1>
          <p>Verifying your invitation...</p>
        </div>
      </div>

      {/* State 5: Success */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          5. Success State
        </h2>
        <div className="coach-onboarding-container">
          <h1>Coach Onboarding</h1>
          <p className="success-message">
            Thank you for accepting, Michael Smith! You are now coaching Sarah
            Johnson for the goal: "Complete my MBA degree by December 2024". We
            recommend reaching out to them on LinkedIn to connect and discuss
            next steps.
          </p>
          <button className="btn btn-primary mt-4">Go to Dashboard</button>
        </div>
      </div>

      {/* State 6: Error States */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>6. Error States</h2>

        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#888", marginBottom: "15px" }}>
            Self-coaching Error
          </h3>
          <div className="coach-onboarding-container">
            <h1>Coach Onboarding</h1>
            <p className="error-message">
              You cannot accept an invitation to coach yourself.
            </p>
            <button className="btn btn-primary mt-4">Go to Dashboard</button>
          </div>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#888", marginBottom: "15px" }}>
            Goal Already Coached
          </h3>
          <div className="coach-onboarding-container">
            <h1>Coach Onboarding</h1>
            <p className="error-message">
              This goal is already being coached by someone else.
            </p>
            <button className="btn btn-primary mt-4">Go to Dashboard</button>
          </div>
        </div>

        <div>
          <h3 style={{ color: "#888", marginBottom: "15px" }}>
            Goal Not Found
          </h3>
          <div className="coach-onboarding-container">
            <h1>Coach Onboarding</h1>
            <p className="error-message">
              The goal you were invited to coach no longer exists or the link is
              invalid.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section (for reference) */}
      <div
        style={{
          marginBottom: "60px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#666", marginBottom: "20px" }}>
          7. Additional UI Elements (for reference)
        </h2>
        <div className="coach-onboarding-container">
          <h1>Coach Onboarding</h1>

          <div className="benefits-list">
            <h2>Why become an accountability coach?</h2>
            <ul>
              <li>
                Help others achieve their goals and make a meaningful impact
              </li>
              <li>Build valuable mentoring and leadership skills</li>
              <li>
                Expand your professional network through meaningful connections
              </li>
              <li>
                Gain experience in goal-setting and progress tracking
                methodologies
              </li>
            </ul>
          </div>

          <div className="cta-section">
            <h3>Ready to make a difference?</h3>
            <p>
              Join our community of accountability coaches and help others reach
              their full potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachOnboardingDemo;
