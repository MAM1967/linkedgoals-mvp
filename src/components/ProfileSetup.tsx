import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const minimalAuth = JSON.parse(
    sessionStorage.getItem("linkedinMinimalAuth") || "{}"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update Firebase user profile
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });

      console.log("Profile updated successfully");

      // Clear the minimal auth data
      sessionStorage.removeItem("linkedinMinimalAuth");

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.removeItem("linkedinMinimalAuth");
    navigate("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0077b5 0%, #00a0dc 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              color: "#0077b5",
              marginBottom: "8px",
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            LinkedGoals
          </h1>
          <h2
            style={{
              color: "#333",
              marginBottom: "16px",
              fontSize: "24px",
              fontWeight: "normal",
            }}
          >
            Complete Your Profile
          </h2>
          <p style={{ color: "#666", lineHeight: "1.5" }}>
            LinkedIn authentication was successful! Please provide your name to
            complete your profile setup.
          </p>
          {minimalAuth.email && (
            <p
              style={{
                color: "#0077b5",
                fontSize: "14px",
                marginTop: "8px",
                fontWeight: "bold",
              }}
            >
              📧 {minimalAuth.email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "bold",
              }}
            >
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              placeholder="Enter your first name"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "bold",
              }}
            >
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              placeholder="Enter your last name (optional)"
            />
          </div>

          {error && (
            <div
              style={{
                color: "#d11124",
                backgroundColor: "#ffeaea",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isSubmitting ? "#ccc" : "#0077b5",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              marginBottom: "12px",
            }}
          >
            {isSubmitting ? "Setting up..." : "Complete Setup"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "transparent",
              color: "#666",
              border: "2px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Skip for now
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#999",
            lineHeight: "1.4",
          }}
        >
          <p>
            Note: We couldn't automatically fetch your profile from LinkedIn.
            This happens when additional permissions are required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
