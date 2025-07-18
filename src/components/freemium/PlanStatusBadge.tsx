import React from "react";
import { PlanType } from "../../types";
import "./freemium.css";

interface PlanStatusBadgeProps {
  planType: PlanType;
  goalCount: number;
  maxGoals: number;
}

export const PlanStatusBadge: React.FC<PlanStatusBadgeProps> = ({
  planType,
  goalCount,
  maxGoals,
}) => {
  const getPlanDisplayName = (plan: PlanType): string => {
    switch (plan) {
      case "free":
        return "Free";
      case "premium":
        return "Premium";
      case "trial":
        return "Trial";
      default:
        return "Free";
    }
  };

  const getPlanColor = (plan: PlanType): string => {
    switch (plan) {
      case "free":
        return "plan-free";
      case "premium":
        return "plan-premium";
      case "trial":
        return "plan-trial";
      default:
        return "plan-free";
    }
  };

  const goalDisplay =
    maxGoals === -1 ? `${goalCount} goals` : `${goalCount}/${maxGoals} goals`;

  return (
    <div className={`plan-status-badge ${getPlanColor(planType)}`}>
      <span className="plan-name">{getPlanDisplayName(planType)}</span>
      <span className="goal-count">{goalDisplay}</span>
    </div>
  );
};
