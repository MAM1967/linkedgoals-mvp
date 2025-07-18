import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoalLimitWarning } from "../../freemium/GoalLimitWarning";

describe("GoalLimitWarning", () => {
  const defaultProps = {
    current: 2,
    max: 3,
  };

  it("renders warning message correctly", () => {
    render(<GoalLimitWarning {...defaultProps} />);

    expect(screen.getByText("1 more goal slot available")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
  });

  it("shows correct message for 2 remaining slots", () => {
    render(<GoalLimitWarning current={1} max={3} />);

    expect(screen.getByText("2 goal slots remaining")).toBeInTheDocument();
  });

  it("shows correct message for 1 remaining slot", () => {
    render(<GoalLimitWarning current={2} max={3} />);

    expect(screen.getByText("1 more goal slot available")).toBeInTheDocument();
  });

  it("calls onUpgradeClick when upgrade button is clicked", () => {
    const mockOnUpgradeClick = jest.fn();
    render(
      <GoalLimitWarning {...defaultProps} onUpgradeClick={mockOnUpgradeClick} />
    );

    const upgradeButton = screen.getByText("Upgrade to Premium");
    fireEvent.click(upgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalledTimes(1);
  });

  it("renders warning icon", () => {
    render(<GoalLimitWarning {...defaultProps} />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<GoalLimitWarning {...defaultProps} />);

    expect(container.firstChild).toHaveClass("goal-limit-warning");
  });

  it("handles edge case with 0 remaining slots", () => {
    render(<GoalLimitWarning current={3} max={3} />);

    expect(screen.getByText("0 goal slots remaining")).toBeInTheDocument();
  });

  it("handles large goal counts", () => {
    render(<GoalLimitWarning current={98} max={100} />);

    expect(screen.getByText("2 goal slots remaining")).toBeInTheDocument();
  });
});
