import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase"; // Assuming auth is exported from your firebase setup
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Navigate to login page after sign out
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            <img src={logo} alt="LinkedGoals Logo" className="logo-image" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <ul className="navbar-links desktop-only">
          <li>
            <Link to="/" className="nav-link">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/add-goal" className="nav-link">
              Add Goal
            </Link>
          </li>
          <li>
            <Link to="/share-goal" className="nav-link">
              Share Goals
            </Link>
          </li>
        </ul>

        {/* Desktop Sign Out Button */}
        <button onClick={handleSignOut} className="navbar-signout desktop-only">
          Sign Out
        </button>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-nav-links">
            <li>
              <Link
                to="/"
                className="mobile-nav-link"
                onClick={toggleMobileMenu}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/add-goal"
                className="mobile-nav-link"
                onClick={toggleMobileMenu}
              >
                Add Goal
              </Link>
            </li>
            <li>
              <Link
                to="/share-goal"
                className="mobile-nav-link"
                onClick={toggleMobileMenu}
              >
                Share Goals
              </Link>
            </li>
            <li>
              <button onClick={handleSignOut} className="mobile-signout">
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
