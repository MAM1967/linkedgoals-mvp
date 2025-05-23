const LinkedInLogin = () => {
  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem("linkedin_oauth_state", state);

    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: "openid profile email",
    });

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  };

  return <button onClick={handleLogin}>Sign in with LinkedIn</button>;
};

export default LinkedInLogin;
