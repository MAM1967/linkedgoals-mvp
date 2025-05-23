import { useState } from "react";
import { auth } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const EmailLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Create a new account
        console.log("Creating new account with:", email);
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in with existing account
        console.log("Signing in with:", email);
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Email auth error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to authenticate with email/password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-login">
      <h3>{isSignUp ? "Create Account" : "Sign In with Email"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading
            ? "Please wait..."
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="toggle-auth">
        <button
          className="text-button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Need an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default EmailLogin;
