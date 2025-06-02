import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, functions } from "../lib/firebase";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("Processing LinkedIn callback...");
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const receivedStateString = urlParams.get("state");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Add detailed logging
        console.log("🔁 LinkedIn callback started");
        console.log("URLSearchParams:", window.location.search);
        console.log("Extracted code:", code ? "present" : "missing");
        console.log("Extracted state string:", receivedStateString);

        // Check for LinkedIn OAuth errors
        if (errorParam) {
          console.error(
            `LinkedIn OAuth error: ${errorParam} - ${errorDescription}`
          );
          setError(
            `LinkedIn sign-in failed: ${errorDescription || errorParam}`
          );
          return;
        }

        if (!code || !receivedStateString) {
          console.error("Missing OAuth parameters", {
            code: !!code,
            state: !!receivedStateString,
          });
          setError("Missing OAuth parameters from LinkedIn");
          return;
        }

        const savedCSRFToken = sessionStorage.getItem(
          "linkedin_oauth_state_csrf"
        );
        console.log("Saved CSRF token from session:", savedCSRFToken);

        let parsedState: { rs: string; plan?: string } | null = null;
        try {
          parsedState = JSON.parse(receivedStateString);
        } catch (e) {
          console.error("Failed to parse state string:", e);
          setError("Invalid state parameter received.");
          return;
        }

        if (!parsedState || typeof parsedState.rs !== "string") {
          console.error("Invalid parsed state object:", parsedState);
          setError("Invalid state structure received.");
          return;
        }

        if (!savedCSRFToken || savedCSRFToken !== parsedState.rs) {
          console.error("OAuth state CSRF mismatch", {
            savedCSRFToken,
            receivedCSRFToken: parsedState.rs,
          });
          setError("Security verification failed (CSRF token mismatch)");
          return;
        }

        // Clear the CSRF token from session storage for security
        sessionStorage.removeItem("linkedin_oauth_state_csrf");

        // If a plan was passed, store it for the dashboard
        if (parsedState && parsedState.plan) {
          // Ensure parsedState is not null
          console.log("Storing selected plan for dashboard:", parsedState.plan);
          sessionStorage.setItem("linkedgoals_selected_plan", parsedState.plan);
        }

        // Log the payload being sent to the backend
        console.log("Calling linkedinLogin with code");
        setStatus("Authenticating with LinkedIn...");

        const linkedinLogin = httpsCallable(functions, "linkedinLogin");
        let result: HttpsCallableResult<any>;

        try {
          result = await linkedinLogin({ code });
          console.log("Function call succeeded:", result);
        } catch (callError: any) {
          console.error("Function call failed:", callError);
          console.error("Error details:", callError.message, callError.details);
          setError(`Authentication failed: ${callError.message}`);
          return;
        }

        if (!result.data || !result.data.customToken) {
          console.error("Invalid response from function:", result.data);
          setError("Invalid response from authentication server");
          return;
        }

        const { customToken } = result.data as { customToken: string };
        console.log(
          "Received customToken:",
          customToken ? "present" : "missing"
        );

        setStatus("Signing in to Firebase...");
        try {
          await signInWithCustomToken(auth, customToken);
          console.log("Firebase sign-in successful");
        } catch (signInError: any) {
          console.error("Firebase sign-in error:", signInError);
          setError(`Firebase sign-in failed: ${signInError.message}`);
          return;
        }

        // Success - redirect to home
        navigate("/");
      } catch (err: any) {
        console.error("LinkedIn callback error:", err);
        setError(`LinkedIn sign-in failed: ${err.message || "Unknown error"}`);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="linkedin-callback-error">
        <h3>Authentication Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Return to Login</button>
      </div>
    );
  }

  return (
    <div className="linkedin-callback-loading">
      <h3>LinkedIn Authentication</h3>
      <p>{status}</p>
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LinkedInCallback;
