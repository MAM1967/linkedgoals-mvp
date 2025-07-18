import React from "react";
import "./freemium.css";

interface GoalLimitReachedProps {
  currentCount: number;
  onUpgradeClick?: () => void;
  onWaitlistClick?: () => void;
}

export const GoalLimitReached: React.FC<GoalLimitReachedProps> = ({
  currentCount,
  onUpgradeClick,
  onWaitlistClick,
}) => {
  return (
    <div className="goal-limit-reached">
      <div className="limit-message">
        <div className="limit-icon">🏆</div>
        <h3>You've reached your 3-goal limit! ({currentCount}/3)</h3>
        <p>
          Ready to achieve even more? Upgrade to Premium for unlimited goals.
        </p>
      </div>

      <div className="upgrade-benefits">
        <h4>Premium includes:</h4>
        <ul>
          <li>✓ Unlimited goals</li>
          <li>✓ Advanced analytics</li>
          <li>✓ Custom categories</li>
          <li>✓ Priority support</li>
        </ul>
      </div>

      <div className="upgrade-actions">
        <button className="upgrade-btn-primary" onClick={onUpgradeClick}>
          Upgrade to Premium
        </button>
        <button className="upgrade-btn-secondary" onClick={onWaitlistClick}>
          Notify Me When Available
        </button>
      </div>
    </div>
  );
};
