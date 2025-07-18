import React from "react";
import "./freemium.css";

interface UpgradePromptProps {
  title: string;
  message: string;
  features: string[];
  onUpgradeClick?: () => void;
  onWaitlistClick?: () => void;
  onClose?: () => void;
  showWaitlist?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  message,
  features,
  onUpgradeClick,
  onWaitlistClick,
  onClose,
  showWaitlist = true,
}) => {
  return (
    <div className="upgrade-prompt-overlay">
      <div className="upgrade-prompt">
        <div className="upgrade-header">
          <h3>{title}</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="upgrade-content">
          <p className="upgrade-message">{message}</p>

          <div className="upgrade-features">
            <h4>Premium includes:</h4>
            <ul>
              {features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="upgrade-actions">
          <button className="upgrade-btn-primary" onClick={onUpgradeClick}>
            Upgrade to Premium
          </button>

          {showWaitlist && (
            <button className="upgrade-btn-secondary" onClick={onWaitlistClick}>
              Notify Me When Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
