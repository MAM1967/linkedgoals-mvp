import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase"; // Assuming auth is exported from your firebase setup
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Navigate to login page after sign out
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">LinkedGoals</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/add-goal">Add Goal</Link>
        </li>
        <li>
          <Link to="/share-goal">Share Goals</Link>
        </li>
      </ul>
      <button onClick={handleSignOut} className="navbar-signout">
        Sign Out
      </button>
    </nav>
  );
};

export default Navbar;
