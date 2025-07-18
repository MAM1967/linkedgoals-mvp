import React from "react";
import { render, screen } from "@testing-library/react";
import { PlanStatusBadge } from "../../freemium/PlanStatusBadge";
import { PlanType } from "../../../types";

describe("PlanStatusBadge", () => {
  const defaultProps = {
    planType: "free" as PlanType,
    goalCount: 2,
    maxGoals: 3,
  };

  it("renders free plan correctly", () => {
    render(<PlanStatusBadge {...defaultProps} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("2/3 goals")).toBeInTheDocument();
  });

  it("renders premium plan correctly", () => {
    render(<PlanStatusBadge planType="premium" goalCount={5} maxGoals={-1} />);

    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("5 goals")).toBeInTheDocument();
  });

  it("renders trial plan correctly", () => {
    render(<PlanStatusBadge planType="trial" goalCount={10} maxGoals={-1} />);

    expect(screen.getByText("Trial")).toBeInTheDocument();
    expect(screen.getByText("10 goals")).toBeInTheDocument();
  });

  it("applies correct CSS classes for free plan", () => {
    const { container } = render(<PlanStatusBadge {...defaultProps} />);

    expect(container.firstChild).toHaveClass("plan-status-badge", "plan-free");
  });

  it("applies correct CSS classes for premium plan", () => {
    const { container } = render(
      <PlanStatusBadge planType="premium" goalCount={5} maxGoals={-1} />
    );

    expect(container.firstChild).toHaveClass(
      "plan-status-badge",
      "plan-premium"
    );
  });

  it("applies correct CSS classes for trial plan", () => {
    const { container } = render(
      <PlanStatusBadge planType="trial" goalCount={10} maxGoals={-1} />
    );

    expect(container.firstChild).toHaveClass("plan-status-badge", "plan-trial");
  });

  it("shows unlimited goals for premium plan", () => {
    render(<PlanStatusBadge planType="premium" goalCount={15} maxGoals={-1} />);

    expect(screen.getByText("15 goals")).toBeInTheDocument();
  });

  it("shows unlimited goals for trial plan", () => {
    render(<PlanStatusBadge planType="trial" goalCount={20} maxGoals={-1} />);

    expect(screen.getByText("20 goals")).toBeInTheDocument();
  });

  it("handles zero goal count", () => {
    render(<PlanStatusBadge planType="free" goalCount={0} maxGoals={3} />);

    expect(screen.getByText("0/3 goals")).toBeInTheDocument();
  });

  it("handles goal count at limit", () => {
    render(<PlanStatusBadge planType="free" goalCount={3} maxGoals={3} />);

    expect(screen.getByText("3/3 goals")).toBeInTheDocument();
  });

  it("handles goal count over limit", () => {
    render(<PlanStatusBadge planType="free" goalCount={5} maxGoals={3} />);

    expect(screen.getByText("5/3 goals")).toBeInTheDocument();
  });

  it("handles large goal counts for unlimited plans", () => {
    render(
      <PlanStatusBadge planType="premium" goalCount={100} maxGoals={-1} />
    );

    expect(screen.getByText("100 goals")).toBeInTheDocument();
  });

  it("renders plan name with correct class", () => {
    render(<PlanStatusBadge {...defaultProps} />);

    const planName = screen.getByText("Free");
    expect(planName).toHaveClass("plan-name");
  });

  it("renders goal count with correct class", () => {
    render(<PlanStatusBadge {...defaultProps} />);

    const goalCount = screen.getByText("2/3 goals");
    expect(goalCount).toHaveClass("goal-count");
  });
});
