import { useEffect, useState } from "react";
import "./LinkedInLogin.css";

// Get LinkedIn configuration from environment variables (Jest compatible)
const LINKEDIN_CLIENT_ID =
  (typeof process !== "undefined" && process.env?.VITE_LINKEDIN_CLIENT_ID) ||
  (typeof window !== "undefined" && (window as any)?.VITE_LINKEDIN_CLIENT_ID) ||
  "7880c93kzzfsgj";

// Dynamic redirect URI based on current hostname
const getRedirectUri = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Environment-specific redirect URIs
    if (hostname.includes('linkedgoals-development') || hostname.includes('development')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname.includes('linkedgoals-staging') || hostname.includes('staging')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${window.location.port}/linkedin`;
    }
    // Production fallback
    return "https://app.linkedgoals.app/linkedin";
  }
  
  // Server-side fallback to production
  return "https://app.linkedgoals.app/linkedin";
};

const REDIRECT_URI =
  (typeof process !== "undefined" && process.env?.VITE_LINKEDIN_REDIRECT_URI) ||
  (typeof window !== "undefined" && (window as any)?.VITE_LINKEDIN_REDIRECT_URI) ||
  getRedirectUri();
// Use correct LinkedIn v2 scopes (not OpenID Connect scopes)
const LINKEDIN_SCOPES = "openid profile email";

const LinkedInLogin = () => {
  const [planFromUrl, setPlanFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get("plan");
    if (plan) {
      setPlanFromUrl(plan);
    }
  }, []);

  const handleLinkedInLogin = async () => {
    try {
      // Generate random state for security (no PKCE needed)
      const state = Math.random().toString(36).substring(7);

      console.log("🌐 Generated OAuth state:", state);

      // Store state in session storage for verification
      sessionStorage.setItem("linkedin_oauth_state", state);

      // Use correct LinkedIn v2 scopes
      console.log("🔐 Requesting LinkedIn scopes:", LINKEDIN_SCOPES);

      // LinkedIn OAuth 2.0 authorization URL (standard endpoint, no PKCE)
      const authUrl = new URL(
        "https://www.linkedin.com/oauth/v2/authorization"
      );
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("scope", LINKEDIN_SCOPES);

      console.log("🚀 Redirecting to LinkedIn OAuth:", authUrl.toString());

      // Redirect to LinkedIn login
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("❌ Error initiating LinkedIn OAuth:", error);
    }
  };

  return <button onClick={handleLinkedInLogin}>Sign in with LinkedIn</button>;
};

export default LinkedInLogin;
