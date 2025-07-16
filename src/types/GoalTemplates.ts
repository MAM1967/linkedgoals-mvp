// Simple MVP Goal Templates for Free Tier
// Limited to existing categories: Career, Productivity, Skills

export interface GoalTemplate {
  id: string;
  name: string;
  category: "Career" | "Productivity" | "Skills";
  description: string;
  icon: string;
  smartFramework: {
    specific: string;
    measurable: {
      type: "Numeric" | "Date" | "DailyStreak" | "Boolean";
      suggestedTarget?: number | string;
      unit?: string;
    };
    achievable: string;
    relevant: string;
    suggestedDuration: number; // days from now
  };
  difficulty: "Beginner" | "Intermediate";
  estimatedTime: string;
}

// MVP Template Collection - Free Tier Only
export const FREE_TEMPLATES: GoalTemplate[] = [
  // CAREER TEMPLATES (2)
  {
    id: "career-certification",
    name: "Professional Certification",
    category: "Career",
    description: "Earn a professional certification to advance your career",
    icon: "🎓",
    smartFramework: {
      specific: "Earn a professional certification in my field",
      measurable: {
        type: "Boolean",
        suggestedTarget: 1,
      },
      achievable: "Study 1 hour daily and schedule exam within timeline",
      relevant: "Advance career prospects and increase earning potential",
      suggestedDuration: 90,
    },
    difficulty: "Intermediate",
    estimatedTime: "1 hour/day",
  },
  {
    id: "career-networking",
    name: "Professional Networking Goal",
    category: "Career",
    description: "Build meaningful professional connections in your industry",
    icon: "🤝",
    smartFramework: {
      specific: "Connect with new professionals and maintain relationships",
      measurable: {
        type: "Numeric",
        suggestedTarget: 5,
        unit: "new connections",
      },
      achievable: "Attend events, use LinkedIn, schedule coffee meetings",
      relevant: "Expand professional network for career opportunities",
      suggestedDuration: 60,
    },
    difficulty: "Beginner",
    estimatedTime: "2 hours/week",
  },

  // PRODUCTIVITY TEMPLATE (1)
  {
    id: "productivity-daily-habit",
    name: "Daily Habit Formation",
    category: "Productivity",
    description: "Build a consistent daily habit to improve productivity",
    icon: "⚡",
    smartFramework: {
      specific: "Establish and maintain a daily productivity habit",
      measurable: {
        type: "DailyStreak",
        suggestedTarget: 21,
        unit: "days",
      },
      achievable: "Start with small, manageable daily actions",
      relevant: "Increase daily productivity and create positive routines",
      suggestedDuration: 21,
    },
    difficulty: "Beginner",
    estimatedTime: "15-30 min/day",
  },

  // SKILLS TEMPLATE (1)
  {
    id: "skills-new-skill",
    name: "Learn New Skill",
    category: "Skills",
    description: "Master a new skill through structured learning and practice",
    icon: "📚",
    smartFramework: {
      specific: "Learn and practice a specific new skill",
      measurable: {
        type: "Numeric",
        suggestedTarget: 1,
        unit: "skill completed",
      },
      achievable: "Dedicate regular time to study and practice",
      relevant: "Expand skillset for personal and professional growth",
      suggestedDuration: 60,
    },
    difficulty: "Beginner",
    estimatedTime: "45 min/day",
  },
];

// Premium upgrade messaging
export const PREMIUM_TEMPLATES_COUNT = 20;
export const PREMIUM_FEATURES = [
  "20+ professional goal templates",
  "Custom categories and templates",
  "Template sharing with colleagues",
  "Advanced template customization",
  "Template usage analytics",
];
