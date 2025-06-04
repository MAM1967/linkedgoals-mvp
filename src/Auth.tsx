import React from "react";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  AuthError,
} from "firebase/auth";
import { FaLinkedin } from "react-icons/fa";
import logo from "./assets/logo.svg";

const LINKEDIN_CLIENT_ID = "7880c93kzzfsgj";
const REDIRECT_URI =
  import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
  "https://app.linkedgoals.app/linkedin";

// PKCE helper functions
const generateRandomString = (length: number): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

interface AuthProps {
  onAuth: (user: User) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    try {
      let userCred;
      if (isRegistering) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      onAuth(userCred.user);
    } catch (err: unknown) {
      const authError = err as AuthError;
      setError(authError.message || "Authentication failed");
    }
  };

  const handleLinkedInLogin = async () => {
    const state = generateRandomString(16);
    const codeVerifier = generateRandomString(48);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store for later use
    localStorage.setItem("linkedin_oauth_state", state);
    localStorage.setItem("linkedin_code_verifier", codeVerifier);

    const authUrl = new URL(
      "https://www.linkedin.com/oauth/native-pkce/authorization"
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "openid profile email");
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    // Redirect to LinkedIn login
    window.location.href = authUrl.toString();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Linkedgoals Logo" className="logo" />
        <h2>{isRegistering ? "Create Your Account" : "Welcome Back"}</h2>
        <p>
          {isRegistering
            ? "Join your accountability circle"
            : "Sign in to continue to Linkedgoals"}
        </p>

        <div className="form-container">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <button onClick={handleAuth} className="auth-button">
            {isRegistering ? "Create Account" : "Sign In"}
          </button>
        </div>

        <div className="linkedin-login">
          <button onClick={handleLinkedInLogin} className="linkedin-button">
            <FaLinkedin />
            Sign in with LinkedIn
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <p className="toggle-auth">
          {isRegistering
            ? "Already have an account? "
            : "Don't have an account? "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="toggle-button"
          >
            {isRegistering ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </div>
  );
}
