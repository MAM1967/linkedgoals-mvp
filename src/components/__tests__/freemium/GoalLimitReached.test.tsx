import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoalLimitReached } from "../../freemium/GoalLimitReached";

describe("GoalLimitReached", () => {
  const defaultProps = {
    currentCount: 3,
  };

  it("renders limit reached message correctly", () => {
    render(<GoalLimitReached {...defaultProps} />);

    expect(
      screen.getByText("You've reached your 3-goal limit! (3/3)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ready to achieve even more? Upgrade to Premium for unlimited goals."
      )
    ).toBeInTheDocument();
  });

  it("renders upgrade benefits list", () => {
    render(<GoalLimitReached {...defaultProps} />);

    expect(screen.getByText("Premium includes:")).toBeInTheDocument();
    expect(screen.getByText("✓ Unlimited goals")).toBeInTheDocument();
    expect(screen.getByText("✓ Advanced analytics")).toBeInTheDocument();
    expect(screen.getByText("✓ Custom categories")).toBeInTheDocument();
    expect(screen.getByText("✓ Priority support")).toBeInTheDocument();
  });

  it("renders upgrade action buttons", () => {
    render(<GoalLimitReached {...defaultProps} />);

    expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
    expect(screen.getByText("Notify Me When Available")).toBeInTheDocument();
  });

  it("calls onUpgradeClick when upgrade button is clicked", () => {
    const mockOnUpgradeClick = jest.fn();
    render(
      <GoalLimitReached {...defaultProps} onUpgradeClick={mockOnUpgradeClick} />
    );

    const upgradeButton = screen.getByText("Upgrade to Premium");
    fireEvent.click(upgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalledTimes(1);
  });

  it("calls onWaitlistClick when waitlist button is clicked", () => {
    const mockOnWaitlistClick = jest.fn();
    render(
      <GoalLimitReached
        {...defaultProps}
        onWaitlistClick={mockOnWaitlistClick}
      />
    );

    const waitlistButton = screen.getByText("Notify Me When Available");
    fireEvent.click(waitlistButton);

    expect(mockOnWaitlistClick).toHaveBeenCalledTimes(1);
  });

  it("renders trophy icon", () => {
    render(<GoalLimitReached {...defaultProps} />);

    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<GoalLimitReached {...defaultProps} />);

    expect(container.firstChild).toHaveClass("goal-limit-reached");
  });

  it("shows correct goal count in title", () => {
    render(<GoalLimitReached currentCount={5} />);

    expect(
      screen.getByText("You've reached your 3-goal limit! (5/3)")
    ).toBeInTheDocument();
  });

  it("handles zero goal count", () => {
    render(<GoalLimitReached currentCount={0} />);

    expect(
      screen.getByText("You've reached your 3-goal limit! (0/3)")
    ).toBeInTheDocument();
  });

  it("works without optional callback props", () => {
    render(<GoalLimitReached {...defaultProps} />);

    // Should render without errors
    expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
    expect(screen.getByText("Notify Me When Available")).toBeInTheDocument();
  });
});
