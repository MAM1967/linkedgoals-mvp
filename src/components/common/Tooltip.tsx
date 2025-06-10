import React, { useState, useRef, useEffect } from "react";
import "./Tooltip.css";

interface TooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  position = "top",
  delay = 500,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip-box tooltip-${position}`}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
