import React, { useEffect, useState } from "react";
import {
  getNextMotivationalQuote,
  MotivationalQuote,
} from "../data/motivationalQuotes";
import logo from "../assets/logo.svg";
import "../styles/MotivationalQuoteScreen.css";

interface MotivationalQuoteScreenProps {
  onComplete: () => void;
  duration?: number; // Duration in milliseconds, defaults to 5000 (5 seconds)
  showSkipButton?: boolean; // Allow users to skip the quote
}

const MotivationalQuoteScreen: React.FC<MotivationalQuoteScreenProps> = ({
  onComplete,
  duration = 5000,
  showSkipButton = true,
}) => {
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Get the next quote in sequence
    const nextQuote = getNextMotivationalQuote();
    setQuote(nextQuote);

    // Fade in animation
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (duration / 50); // Update every 50ms
        const newProgress = prev + increment;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    // Auto-complete timer
    const completeTimer = setTimeout(() => {
      handleComplete();
    }, duration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleComplete = () => {
    setIsVisible(false);
    // Small delay for fade-out animation
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!quote) {
    return null;
  }

  return (
    <div className={`motivational-quote-screen ${isVisible ? "visible" : ""}`}>
      {/* Background gradient overlay */}
      <div className="quote-background" />

      {/* Main content */}
      <div className="quote-container">
        {/* LinkedGoals logo */}
        <div className="quote-logo">
          <img src={logo} alt="LinkedGoals" className="logo-image" />
        </div>

        {/* Quote content */}
        <div className="quote-content">
          <div className="quote-icon">💫</div>
          <blockquote className="quote-text">"{quote.quote}"</blockquote>
          <cite className="quote-author">— {quote.author}</cite>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-text">Preparing your dashboard...</p>
        </div>

        {/* Skip button */}
        {showSkipButton && (
          <button
            className="skip-button"
            onClick={handleSkip}
            aria-label="Skip motivation quote"
          >
            Skip
          </button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="floating-elements">
        <div className="floating-element element-1">✨</div>
        <div className="floating-element element-2">⭐</div>
        <div className="floating-element element-3">🌟</div>
        <div className="floating-element element-4">💫</div>
      </div>
    </div>
  );
};

export default MotivationalQuoteScreen;
