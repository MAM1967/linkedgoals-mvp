import React from "react";
import {
  GoalTemplate,
  FREE_TEMPLATES,
  PREMIUM_TEMPLATES_COUNT,
  PREMIUM_FEATURES,
} from "../types/GoalTemplates";
import "./TemplateSelector.css";

interface TemplateSelectorProps {
  onSelectTemplate: (template: GoalTemplate) => void;
  onCreateFromScratch: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCreateFromScratch,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    return difficulty === "Beginner" ? "#22c55e" : "#f59e0b";
  };

  return (
    <div className="template-selector">
      <div className="template-header">
        <h2>Choose How to Create Your Goal</h2>
        <p>Start with a proven template or build from scratch</p>
      </div>

      <div className="template-options">
        {/* Create from Scratch Option */}
        <div className="template-card create-from-scratch">
          <div className="template-card-header">
            <div className="template-icon">✨</div>
            <h3>Create from Scratch</h3>
          </div>
          <p>Build your own custom goal using our SMART framework</p>
          <button
            className="template-btn template-btn-custom"
            onClick={onCreateFromScratch}
          >
            Start Fresh
          </button>
        </div>

        {/* Free Templates */}
        {FREE_TEMPLATES.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-card-header">
              <div className="template-icon">{template.icon}</div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <span className="template-category">{template.category}</span>
              </div>
            </div>

            <p className="template-description">{template.description}</p>

            <div className="template-meta">
              <span
                className="difficulty-badge"
                style={{
                  backgroundColor: getDifficultyColor(template.difficulty),
                }}
              >
                {template.difficulty}
              </span>
              <span className="time-estimate">{template.estimatedTime}</span>
            </div>

            <div className="template-preview">
              <strong>Goal Preview:</strong>
              <p>{template.smartFramework.specific}</p>
            </div>

            <button
              className="template-btn"
              onClick={() => onSelectTemplate(template)}
            >
              Use This Template
            </button>
          </div>
        ))}

        {/* Premium Upgrade Card */}
        <div className="template-card premium-upgrade">
          <div className="template-card-header">
            <div className="template-icon">⭐</div>
            <h3>Premium Templates</h3>
            <span className="premium-badge">PREMIUM</span>
          </div>

          <p>Unlock {PREMIUM_TEMPLATES_COUNT}+ professional goal templates</p>

          <div className="premium-features">
            {PREMIUM_FEATURES.slice(0, 3).map((feature, index) => (
              <div key={index} className="premium-feature">
                ✓ {feature}
              </div>
            ))}
          </div>

          <button
            className="template-btn template-btn-premium"
            onClick={() => {
              // TODO: Navigate to premium signup/waitlist
              alert("Premium templates coming soon! Join the waitlist.");
            }}
          >
            Upgrade to Premium
          </button>

          <p className="premium-note">
            Join the waitlist for early access to Premium features
          </p>
        </div>
      </div>

      <div className="template-footer">
        <p className="free-tier-note">
          <strong>Free Tier:</strong> 4 templates available • Up to 3 goals
        </p>
      </div>
    </div>
  );
};

export default TemplateSelector;
