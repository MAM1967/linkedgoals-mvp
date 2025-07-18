import React from "react";
import "./freemium.css";

interface GoalLimitWarningProps {
  current: number;
  max: number;
  onUpgradeClick?: () => void;
}

export const GoalLimitWarning: React.FC<GoalLimitWarningProps> = ({
  current,
  max,
  onUpgradeClick,
}) => {
  const remaining = max - current;

  return (
    <div className="goal-limit-warning">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <span className="warning-text">
          {remaining === 1
            ? "1 more goal slot available"
            : `${remaining} goal slots remaining`}
        </span>
        <button className="upgrade-btn-small" onClick={onUpgradeClick}>
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
};
