import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../lib/firebase";

const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        console.log("LinkedIn callback verified successfully");
        console.log("Extracted code: present");
        console.log("Extracted state:", state);

        if (error) {
          console.error("LinkedIn OAuth error:", error);
          setStatus("LinkedIn authorization failed");
          return;
        }

        if (!code) {
          console.error("No authorization code received");
          setStatus("No authorization code received");
          return;
        }

        setStatus("Calling LinkedIn OAuth Firebase Function...");
        console.log("Calling LinkedIn OAuth Firebase Function...");

        // Call Firebase Function for LinkedIn OAuth
        const response = await fetch(
          "https://us-central1-linkedgoals-d7053.cloudfunctions.net/linkedinlogin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, state }),
          }
        );

        console.log("Function response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Function error:", errorData);
          throw new Error(
            `Function failed: ${errorData.error || "Unknown error"}`
          );
        }

        const result = await response.json();
        console.log("Function result:", result);

        if (!result.success || !result.customToken) {
          throw new Error("Invalid response from authentication function");
        }

        setStatus("Signing in to Firebase...");
        console.log("Signing in with custom token...");

        // Sign in with the custom token
        await signInWithCustomToken(auth, result.customToken);

        console.log("Successfully signed in to Firebase");

        // Check if we got full profile data or minimal profile
        if (result.email && result.displayName && result.profileData) {
          setStatus("Authentication successful! You have a complete profile.");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        } else {
          setStatus("Authentication successful! Setting up your profile...");
          // Store minimal profile info for profile setup
          sessionStorage.setItem(
            "linkedinMinimalAuth",
            JSON.stringify({
              userId: result.userId,
              email: result.email,
              message: result.message,
            })
          );
          setTimeout(() => {
            navigate("/profile-setup");
          }, 1000);
        }
      } catch (error) {
        console.error("LinkedIn callback error:", error);
        setStatus(
          `Authentication failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (status.includes("failed") || status.includes("error")) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>LinkedIn Authentication Failed</h2>
        <p style={{ color: "red", marginBottom: "20px" }}>{status}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0077b5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Processing LinkedIn Authentication</h2>
      <p>{status}</p>
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #0077b5",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        ></div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LinkedInCallback;
