import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";

// Page/Component Imports
import LinkedInCallback from "./components/LinkedInCallback";
import LinkedInLogin from "./components/LinkedInLogin";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import GoalInputPage from "./components/GoalInputPage";
import SocialSharePage from "./components/SocialSharePage";
import CoachOnboardingPage from "./components/CoachOnboardingPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";

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
  const { user, loading } = useAuth();
  const [welcomePlan, setWelcomePlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const plan = localStorage.getItem("linkedgoals_selected_plan");
      if (plan) {
        setWelcomePlan(plan);
        localStorage.removeItem("linkedgoals_selected_plan");
      }
    } else {
      // Clear welcome plan if user logs out
      setWelcomePlan(null);
    }
  }, [user]);

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
          {/* Public routes that are always accessible */}
          <Route path="/linkedin" element={<LinkedInCallback />} />
          <Route path="/coach-onboarding" element={<CoachOnboardingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes - This must come before the general redirects */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Route>

          {/* Routes for unauthenticated users */}
          {!user && (
            <>
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
              {/* Redirect any other path to /login */}
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}

          {/* Routes for authenticated users */}
          {user && (
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
              {/* Redirect authenticated users from /login to dashboard */}
              <Route path="/login" element={<Navigate to="/" />} />
              {/* Fallback for authenticated users to redirect to home for any other unmatched route*/}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
