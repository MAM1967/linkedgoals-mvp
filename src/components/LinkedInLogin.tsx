import { useEffect, useState } from "react";

const LinkedInLogin = () => {
  const [planFromUrl, setPlanFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get("plan");
    if (plan) {
      setPlanFromUrl(plan);
    }
    // The CSRF token and full state string will now be generated in handleLogin
  }, []); // Only concerned with plan on mount

  const handleLogin = () => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const stateObject: { rs: string; plan?: string } = { rs: randomString };

    if (planFromUrl) {
      // Use the plan captured from useEffect
      stateObject.plan = planFromUrl;
    }

    const finalStateString = JSON.stringify(stateObject);

    // Store the CSRF part in session storage *just before* redirecting
    sessionStorage.setItem("linkedin_oauth_state_csrf", randomString);
    console.log(
      "[LinkedInLogin] CSRF token just stored in session for redirect:",
      randomString
    );
    console.log(
      "[LinkedInLogin] Full state string for redirect:",
      finalStateString
    );

    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
    console.log("[LinkedInLogin] Using Client ID:", clientId);
    console.log("[LinkedInLogin] Using Redirect URI:", redirectUri);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: finalStateString, // Use the freshly generated state string
      scope: "openid profile email",
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  };

  return <button onClick={handleLogin}>Sign in with LinkedIn</button>;
};

export default LinkedInLogin;
