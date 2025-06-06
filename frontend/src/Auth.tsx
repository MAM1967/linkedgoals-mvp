import { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  AuthError,
} from "firebase/auth";

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

  return (
    <div
      style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}
    >
      <h2>{isRegistering ? "Register" : "Login"}</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
      />
      <button
        onClick={handleAuth}
        style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}
      >
        {isRegistering ? "Create Account" : "Log In"}
      </button>

      <div>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ fontSize: "0.9rem" }}
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "New? Create an account"}
        </button>
      </div>

      {/* LinkedIn OAuth integration moved to main Auth component */}
      <div style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
        <p>LinkedIn OAuth integration available in main application</p>
      </div>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}
