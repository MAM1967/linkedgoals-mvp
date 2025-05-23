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
const REDIRECT_URI = "https://linkedgoals-d7053.web.app/linkedin";

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

  const handleLinkedInLogin = () => {
    // Generate random state for security
    const state = Math.random().toString(36).substring(7);
    console.log("🌐 Generated OAuth state:", state);
    sessionStorage.setItem("linkedin_oauth_state", state);

    // Define the scope - only request basic profile
    const scope = "openid profile email";
    console.log("🔐 Using LinkedIn scope:", scope);

    // LinkedIn OAuth 2.0 authorization URL
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", scope);

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
