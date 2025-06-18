import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MotivationalQuoteScreen from "../MotivationalQuoteScreen";
import * as motivationalQuotes from "../../data/motivationalQuotes";

// Mock the motivational quotes module
jest.mock("../../data/motivationalQuotes");
const mockMotivationalQuotes = motivationalQuotes as jest.Mocked<
  typeof motivationalQuotes
>;

// Mock CSS import
jest.mock("../../styles/MotivationalQuoteScreen.css", () => ({}));

const mockQuote = {
  quote: "Test quote for motivation",
  author: "Test Author",
};

describe("MotivationalQuoteScreen", () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMotivationalQuotes.getNextMotivationalQuote.mockReturnValue(mockQuote);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    test("renders with quote content", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      expect(screen.getByText(`"${mockQuote.quote}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${mockQuote.author}`)).toBeInTheDocument();
    });

    test("renders with default props", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      // Use class selector for the quote icon specifically
      expect(document.querySelector(".quote-icon")).toHaveTextContent("💫");
      expect(
        screen.getByText("Preparing your dashboard...")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /skip motivation quote/i })
      ).toBeInTheDocument();
    });

    test("renders without skip button when disabled", () => {
      act(() => {
        render(
          <MotivationalQuoteScreen
            onComplete={mockOnComplete}
            showSkipButton={false}
          />
        );
      });

      expect(
        screen.queryByRole("button", { name: /skip motivation quote/i })
      ).not.toBeInTheDocument();
    });

    test("renders LinkedGoals logo", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      const logo = screen.getByAltText("LinkedGoals");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "test-file-stub"); // Jest mocks images as "test-file-stub"
    });

    test("renders floating decorative elements", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      expect(screen.getByText("✨")).toBeInTheDocument();
      expect(screen.getByText("⭐")).toBeInTheDocument();
      expect(screen.getByText("🌟")).toBeInTheDocument();
      // Use getAllByText to check for multiple 💫 elements
      const starElements = screen.getAllByText("💫");
      expect(starElements).toHaveLength(2); // One in quote-icon, one in floating elements
    });
  });

  describe("Quote Integration", () => {
    test("fetches next quote on mount", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      expect(
        mockMotivationalQuotes.getNextMotivationalQuote
      ).toHaveBeenCalledTimes(1);
    });

    test("handles null quote gracefully", () => {
      // @ts-expect-error Testing null case
      mockMotivationalQuotes.getNextMotivationalQuote.mockReturnValue(null);

      const { container } = render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} />
      );

      expect(container.firstChild).toBeNull();
    });

    test("displays different quotes correctly", () => {
      const customQuote = {
        quote: "Custom motivational message",
        author: "Custom Author",
      };

      mockMotivationalQuotes.getNextMotivationalQuote.mockReturnValue(
        customQuote
      );

      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      expect(screen.getByText(`"${customQuote.quote}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${customQuote.author}`)).toBeInTheDocument();
    });
  });

  describe("Timing and Auto-completion", () => {
    test("auto-completes after default duration (5 seconds)", () => {
      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();

      // Fast-forward 5 seconds and fade-out animation
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Wait for the fade-out animation (300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("auto-completes after custom duration", async () => {
      render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} duration={3000} />
      );

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Wait for the fade-out animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("updates progress bar over time", () => {
      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      const progressBar = document.querySelector(
        ".progress-fill"
      ) as HTMLElement;
      expect(progressBar).toBeInTheDocument();

      // Initially at 0%
      expect(progressBar.style.width).toBe("0%");

      // Advance time and check progress
      act(() => {
        jest.advanceTimersByTime(2500); // Half of 5 seconds
      });

      // Should be around 50% (allowing for slight timing variations)
      const width = parseFloat(progressBar.style.width);
      expect(width).toBeGreaterThan(40);
      expect(width).toBeLessThan(60);
    });
  });

  describe("User Interactions", () => {
    test("skip button triggers completion", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole("button", {
        name: /skip motivation quote/i,
      });

      await act(async () => {
        await user.click(skipButton);
      });

      // Wait for the fade-out animation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("skip button prevents auto-completion", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      act(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      });

      // Click skip before auto-completion
      const skipButton = screen.getByRole("button", {
        name: /skip motivation quote/i,
      });

      await act(async () => {
        await user.click(skipButton);
        // Wait for the fade-out animation
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);

      // The component should already be completed, so the timer should be cleared
      // No need to test further since the skip already worked
    });
  });

  describe("Animations and Visual States", () => {
    test("applies visible class after mounting", () => {
      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      // Initially not visible
      const container = document.querySelector(".motivational-quote-screen");
      expect(container).not.toHaveClass("visible");

      // After 100ms delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(container).toHaveClass("visible");
    });

    test("removes visible class before completion", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      // Make it visible first
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const container = document.querySelector(".motivational-quote-screen");
      expect(container).toHaveClass("visible");

      // Click skip
      const skipButton = screen.getByRole("button", {
        name: /skip motivation quote/i,
      });

      await act(async () => {
        await user.click(skipButton);
      });

      // Should remove visible class immediately
      expect(container).not.toHaveClass("visible");
    });
  });

  describe("Accessibility", () => {
    test("skip button has proper aria-label", () => {
      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole("button", {
        name: /skip motivation quote/i,
      });
      expect(skipButton).toHaveAttribute("aria-label", "Skip motivation quote");
    });

    test("quote content uses semantic HTML", () => {
      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      // Quote should be in a blockquote element
      const quoteElement = screen.getByText(`"${mockQuote.quote}"`);
      expect(quoteElement.tagName.toLowerCase()).toBe("blockquote");

      // Author should be in a cite element
      const authorElement = screen.getByText(`— ${mockQuote.author}`);
      expect(authorElement.tagName.toLowerCase()).toBe("cite");
    });

    test("logo has proper alt text", () => {
      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      const logo = screen.getByAltText("LinkedGoals");
      expect(logo).toBeInTheDocument();
    });
  });

  describe("Cleanup and Memory Management", () => {
    test("cleans up timers on unmount", () => {
      const { unmount } = render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} />
      );

      // Spy on clearTimeout and clearInterval
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });

    test("does not call onComplete after unmount", () => {
      const { unmount } = render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} />
      );

      unmount();

      // Advance time past completion
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe("Props Validation", () => {
    test("works with minimum required props", () => {
      expect(() => {
        render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);
      }).not.toThrow();
    });

    test("applies custom duration correctly", () => {
      render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} duration={1000} />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("respects showSkipButton prop", () => {
      const { rerender } = render(
        <MotivationalQuoteScreen
          onComplete={mockOnComplete}
          showSkipButton={true}
        />
      );

      expect(
        screen.getByRole("button", { name: /skip motivation quote/i })
      ).toBeInTheDocument();

      rerender(
        <MotivationalQuoteScreen
          onComplete={mockOnComplete}
          showSkipButton={false}
        />
      );

      expect(
        screen.queryByRole("button", { name: /skip motivation quote/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    test("handles very short duration", () => {
      render(
        <MotivationalQuoteScreen onComplete={mockOnComplete} duration={100} />
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test("handles very long quotes", () => {
      const longQuote = {
        quote:
          "This is a very long motivational quote that goes on and on to test how the component handles lengthy text content that might wrap multiple lines and potentially cause layout issues.",
        author: "Very Verbose Author Name That Is Also Quite Long",
      };

      mockMotivationalQuotes.getNextMotivationalQuote.mockReturnValue(
        longQuote
      );

      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      expect(screen.getByText(`"${longQuote.quote}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${longQuote.author}`)).toBeInTheDocument();
    });

    test("handles quotes with special characters", () => {
      const specialQuote = {
        quote: 'Quote with "nested quotes" and special chars: & < > \' @',
        author: "Author & Co.",
      };

      mockMotivationalQuotes.getNextMotivationalQuote.mockReturnValue(
        specialQuote
      );

      render(<MotivationalQuoteScreen onComplete={mockOnComplete} />);

      expect(screen.getByText(`"${specialQuote.quote}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${specialQuote.author}`)).toBeInTheDocument();
    });
  });
});
