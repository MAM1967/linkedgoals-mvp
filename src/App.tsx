import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";

// Page/Component Imports
import LinkedInCallback from "./components/LinkedInCallback";
import LinkedInLogin from "./components/LinkedInLogin";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import GoalInputPage from "./components/GoalInputPage";
import SocialSharePage from "./components/SocialSharePage";
import CoachOnboardingPage from "./components/CoachOnboardingPage";

import logo from "./assets/logo.svg";
import "./app.css";
import "./Navbar.css";

// Layout component for authenticated users
const AuthenticatedLayout: React.FC<{
  children: React.ReactNode;
  welcomePlan?: string | null; // Optional: To show a welcome message for a specific plan
  onDismissWelcome?: () => void; // Optional: Callback to dismiss the welcome message
}> = ({ children, welcomePlan, onDismissWelcome }) => {
  return (
    <div className="authenticated-layout">
      <Navbar />
      <main className="main-content">
        {welcomePlan && (
          <div className="welcome-banner">
            <p>
              Welcome! You're on the {welcomePlan} plan. Get started by setting
              your first goal!
            </p>
            {onDismissWelcome && (
              <button onClick={onDismissWelcome} className="dismiss-button">
                &times;
              </button>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [welcomePlan, setWelcomePlan] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("=== AUTH STATE CHANGED ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log(
        "Auth state changed:",
        currentUser ? "logged in as " + currentUser.uid : "logged out"
      );
      console.log("Current user object:", currentUser);
      console.log("========================");

      setUser(currentUser);
      if (currentUser) {
        const plan = localStorage.getItem("linkedgoals_selected_plan");
        if (plan) {
          setWelcomePlan(plan);
          localStorage.removeItem("linkedgoals_selected_plan");
        }
      } else {
        // Clear welcome plan if user logs out
        setWelcomePlan(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <img src={logo} alt="LinkedGoals Logo" className="loading-logo" />
        <div className="loading-spinner-text">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/linkedin" element={<LinkedInCallback />} />
          <Route path="/coach-onboarding" element={<CoachOnboardingPage />} />

          {/* Public route for login - if not logged in, show login page */}
          {!user && (
            <Route
              path="/login"
              element={
                <div className="login-container">
                  <div className="login-card">
                    <img src={logo} alt="Linkedgoals Logo" className="logo" />
                    <h2>Sign in to Linkedgoals</h2>
                    <LinkedInLogin />
                  </div>
                </div>
              }
            />
          )}

          {/* Authenticated Routes */}
          {user ? (
            <>
              <Route
                path="/"
                element={
                  <AuthenticatedLayout
                    welcomePlan={welcomePlan}
                    onDismissWelcome={() => setWelcomePlan(null)}
                  >
                    <Dashboard />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/add-goal"
                element={
                  <AuthenticatedLayout
                    welcomePlan={welcomePlan}
                    onDismissWelcome={() => setWelcomePlan(null)}
                  >
                    <GoalInputPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/share-goal"
                element={
                  <AuthenticatedLayout
                    welcomePlan={welcomePlan}
                    onDismissWelcome={() => setWelcomePlan(null)}
                  >
                    <SocialSharePage />
                  </AuthenticatedLayout>
                }
              />
              {/* Any other authenticated routes can go here */}
              {/* If user is logged in and tries to go to /login, redirect to dashboard */}
              <Route path="/login" element={<Navigate to="/" />} />
            </>
          ) : (
            // If not logged in, all paths (except /linkedin and /login) redirect to /login
            <Route path="*" element={<Navigate to="/login" />} />
          )}
          {/* Fallback for any unmatched routes when logged in (optional, could also be a 404 component) */}
          {user && <Route path="*" element={<Navigate to="/" />} />}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
