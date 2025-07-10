# User Story 4.1: Goal Templates & Categories - Implementation Plan

## 📅 **Project Overview**

**Date**: July 10, 2025  
**Sprint**: Sprint 3 (July 13-26, 2025)  
**Priority**: Medium | **Effort**: 8 story points  
**Status**: 📋 **READY FOR IMPLEMENTATION** (Starts in 3 days)

## 🎯 **User Story Details**

**As a user**, I want pre-built goal templates so that I can quickly create structured goals without starting from scratch.

### **Acceptance Criteria**

- [ ] 10+ goal templates (fitness, career, education, finance)
- [ ] Custom category creation
- [ ] Template sharing between users
- [ ] Smart template suggestions based on user history
- [ ] Template customization options

## ✅ **Current Foundation Analysis**

### **Already Implemented**

1. **Goal Creation Wizard**: Complete 7-step SMART goal process
2. **Category System**: Basic MVP categories (Career, Productivity, Skills)
3. **Database Schema**: Goals have category field support
4. **SMART Framework**: Full implementation with 4 measurable types
5. **Progress Tracking**: Complete progress calculation system

### **Technology Stack Ready**

- React + TypeScript frontend
- Firebase Firestore for data storage
- Existing goal management infrastructure
- Category filtering and progress tracking

## 🏗️ **Technical Implementation Plan**

### **Phase 1: Data Structure & Templates (Days 8-9)**

#### **1.1 Template Data Structure**

```typescript
// src/types/GoalTemplates.ts
export interface GoalTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
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
  tags: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string; // e.g., "30 min/day"
  popularity: number;
  createdBy: "system" | string; // user ID for custom templates
  isCustomizable: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isDefault: boolean;
}
```

#### **1.2 Initial Template Collection**

```typescript
// src/data/goalTemplates.ts
export const SYSTEM_TEMPLATES: GoalTemplate[] = [
  // FITNESS TEMPLATES (3)
  {
    id: "fitness-30-day-workout",
    name: "30-Day Workout Challenge",
    category: "Health & Fitness",
    description:
      "Build a consistent exercise habit with a 30-day workout routine",
    icon: "💪",
    smartFramework: {
      specific: "Complete a workout routine for 30 consecutive days",
      measurable: {
        type: "DailyStreak",
        suggestedTarget: 30,
        unit: "days",
      },
      achievable: "Commit to 30 minutes of exercise daily",
      relevant: "Improve physical health and build lasting fitness habits",
      suggestedDuration: 30,
    },
    tags: ["fitness", "habit", "health", "workout"],
    difficulty: "Beginner",
    estimatedTime: "30 min/day",
    popularity: 95,
    createdBy: "system",
    isCustomizable: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "fitness-weight-loss",
    name: "Healthy Weight Loss Goal",
    category: "Health & Fitness",
    description: "Achieve sustainable weight loss through healthy habits",
    icon: "⚖️",
    smartFramework: {
      specific: "Lose weight through healthy diet and exercise",
      measurable: {
        type: "Numeric",
        suggestedTarget: 10,
        unit: "lbs",
      },
      achievable: "Lose 1-2 pounds per week through calorie deficit",
      relevant: "Improve health and boost confidence",
      suggestedDuration: 90,
    },
    tags: ["weight-loss", "health", "diet", "exercise"],
    difficulty: "Intermediate",
    estimatedTime: "1 hour/day",
    popularity: 88,
    createdBy: "system",
    isCustomizable: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CAREER TEMPLATES (3)
  {
    id: "career-certification",
    name: "Professional Certification",
    category: "Career Development",
    description: "Earn a professional certification to advance your career",
    icon: "🎓",
    smartFramework: {
      specific: "Earn a professional certification in my field",
      measurable: {
        type: "Boolean",
        suggestedTarget: null,
      },
      achievable: "Study 1 hour daily and schedule exam",
      relevant: "Advance career prospects and increase earning potential",
      suggestedDuration: 120,
    },
    tags: ["certification", "career", "professional-development", "skills"],
    difficulty: "Intermediate",
    estimatedTime: "1 hour/day",
    popularity: 92,
    createdBy: "system",
    isCustomizable: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // EDUCATION TEMPLATES (2)
  {
    id: "education-read-books",
    name: "Annual Reading Challenge",
    category: "Education",
    description: "Expand knowledge and improve focus through regular reading",
    icon: "📚",
    smartFramework: {
      specific: "Read books to expand knowledge and improve focus",
      measurable: {
        type: "Numeric",
        suggestedTarget: 12,
        unit: "books",
      },
      achievable: "Read 30 minutes daily and track progress",
      relevant: "Continuous learning and personal development",
      suggestedDuration: 365,
    },
    tags: ["reading", "learning", "knowledge", "books"],
    difficulty: "Beginner",
    estimatedTime: "30 min/day",
    popularity: 85,
    createdBy: "system",
    isCustomizable: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // FINANCE TEMPLATES (2)
  {
    id: "finance-emergency-fund",
    name: "Build Emergency Fund",
    category: "Finance",
    description: "Create financial security with an emergency savings fund",
    icon: "💰",
    smartFramework: {
      specific: "Build an emergency fund for financial security",
      measurable: {
        type: "Numeric",
        suggestedTarget: 10000,
        unit: "dollars",
      },
      achievable: "Save $500 per month consistently",
      relevant: "Provide financial security and peace of mind",
      suggestedDuration: 365,
    },
    tags: ["savings", "emergency-fund", "financial-security", "money"],
    difficulty: "Intermediate",
    estimatedTime: "30 min/week",
    popularity: 90,
    createdBy: "system",
    isCustomizable: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "health-fitness",
    name: "Health & Fitness",
    description: "Physical health, exercise, and wellness goals",
    icon: "💪",
    color: "#22c55e",
    isDefault: true,
  },
  {
    id: "career-development",
    name: "Career Development",
    description: "Professional growth and career advancement",
    icon: "🎯",
    color: "#3b82f6",
    isDefault: true,
  },
  {
    id: "education",
    name: "Education",
    description: "Learning, skills development, and knowledge expansion",
    icon: "📚",
    color: "#8b5cf6",
    isDefault: true,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Financial goals, savings, and money management",
    icon: "💰",
    color: "#f59e0b",
    isDefault: true,
  },
  {
    id: "personal-development",
    name: "Personal Development",
    description: "Self-improvement and personal growth",
    icon: "🌱",
    color: "#06b6d4",
    isDefault: true,
  },
];
```

### **Phase 2: UI Components (Days 8-9)**

#### **2.1 Template Selection Component**

```typescript
// src/components/TemplateGallery.tsx
import React, { useState, useMemo } from 'react';
import { GoalTemplate, TemplateCategory } from '../types/GoalTemplates';
import './TemplateGallery.css';

interface TemplateGalleryProps {
  templates: GoalTemplate[];
  categories: TemplateCategory[];
  onSelectTemplate: (template: GoalTemplate) => void;
  onCreateFromScratch: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  categories,
  onSelectTemplate,
  onCreateFromScratch
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'difficulty'>('popularity');

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="template-gallery">
      <div className="template-gallery__header">
        <h2>Choose a Goal Template</h2>
        <p>Start with a proven template or create from scratch</p>
      </div>

      <div className="template-gallery__controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Templates
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="popularity">Most Popular</option>
          <option value="name">A to Z</option>
          <option value="difficulty">Difficulty</option>
        </select>
      </div>

      <div className="template-gallery__content">
        <div className="create-from-scratch-card">
          <div className="template-card template-card--custom">
            <div className="template-header">
              <div className="template-icon">✨</div>
              <h3>Create from Scratch</h3>
            </div>
            <p>Build your own custom goal using our SMART framework</p>
            <button
              className="template-btn template-btn--custom"
              onClick={onCreateFromScratch}
            >
              Start Fresh
            </button>
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### **2.2 Template Card Component**

```typescript
// src/components/TemplateCard.tsx
import React from 'react';
import { GoalTemplate } from '../types/GoalTemplates';
import './TemplateCard.css';

interface TemplateCardProps {
  template: GoalTemplate;
  onSelect: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="template-card">
      <div className="template-header">
        <div className="template-icon">{template.icon}</div>
        <div className="template-info">
          <h3 className="template-name">{template.name}</h3>
          <span className="template-category">{template.category}</span>
        </div>
      </div>

      <p className="template-description">{template.description}</p>

      <div className="template-details">
        <div className="template-meta">
          <span
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(template.difficulty) }}
          >
            {template.difficulty}
          </span>
          <span className="time-estimate">{template.estimatedTime}</span>
        </div>

        <div className="template-tags">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      </div>

      <div className="template-preview">
        <h4>Goal Preview:</h4>
        <p className="preview-text">{template.smartFramework.specific}</p>
      </div>

      <button className="template-btn" onClick={onSelect}>
        Use This Template
      </button>
    </div>
  );
};
```

### **Phase 3: Integration with Goal Creation (Day 10)**

#### **3.1 Updated Goal Input Page**

```typescript
// Updates to src/components/GoalInputPage.tsx

// Add template selection as Step 0
const GoalInputPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0); // Start with template selection
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  // ... existing state

  const handleTemplateSelection = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setIsUsingTemplate(true);

    // Pre-populate form with template data
    setGoalDescription(template.description);
    setCategory(template.category);
    setSpecific(template.smartFramework.specific);
    setMeasurableType(template.smartFramework.measurable.type);
    setMeasurableTarget(template.smartFramework.measurable.suggestedTarget?.toString() || '');
    setMeasurableUnit(template.smartFramework.measurable.unit || '');
    setAchievable(template.smartFramework.achievable);
    setRelevant(template.smartFramework.relevant);

    // Set suggested due date
    const suggestedDueDate = new Date();
    suggestedDueDate.setDate(suggestedDueDate.getDate() + template.smartFramework.suggestedDuration);
    setDueDate(suggestedDueDate.toISOString().split('T')[0]);

    setCurrentStep(1); // Skip to step 1
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setIsUsingTemplate(false);
    setCurrentStep(1);
  };

  // Update render logic to include template selection
  if (currentStep === 0) {
    return (
      <TemplateGallery
        templates={SYSTEM_TEMPLATES}
        categories={TEMPLATE_CATEGORIES}
        onSelectTemplate={handleTemplateSelection}
        onCreateFromScratch={handleCreateFromScratch}
      />
    );
  }

  // ... rest of existing component logic
};
```

### **Phase 4: Analytics & Tracking**

#### **4.1 Template Usage Analytics**

```typescript
// src/utils/templateAnalytics.ts
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

export const trackTemplateUsage = async (
  templateId: string,
  userId: string
) => {
  try {
    // Update template popularity
    const templateRef = doc(db, "goalTemplates", templateId);
    await updateDoc(templateRef, {
      popularity: increment(1),
      lastUsed: new Date(),
      usageCount: increment(1),
    });

    // Track user's template usage
    const userTemplateRef = doc(
      db,
      `users/${userId}/templateUsage`,
      templateId
    );
    await updateDoc(userTemplateRef, {
      count: increment(1),
      lastUsed: new Date(),
    });
  } catch (error) {
    console.error("Error tracking template usage:", error);
  }
};

export const getRecommendedTemplates = async (
  userId: string
): Promise<GoalTemplate[]> => {
  // TODO: Implement smart recommendations based on:
  // - User's goal history
  // - Category preferences
  // - Completion rates
  // - Similar user patterns
  return [];
};
```

## 🧪 **Testing Strategy**

### **Unit Tests**

- [ ] Template data structure validation
- [ ] Template filtering and sorting logic
- [ ] Goal creation with templates
- [ ] Template customization functionality

### **Integration Tests**

- [ ] Template selection to goal creation flow
- [ ] Template analytics tracking
- [ ] Database operations for templates
- [ ] Template recommendation engine

### **User Experience Tests**

- [ ] Template discovery and selection
- [ ] Goal customization from templates
- [ ] Template performance and loading
- [ ] Mobile responsiveness

## 📊 **Success Metrics**

### **User Adoption**

- 70%+ of new goals created using templates
- 50%+ template completion rate vs custom goals
- 3+ average templates tried per user

### **Template Performance**

- Load time < 2 seconds for template gallery
- 90%+ successful template-to-goal conversions
- 80%+ user satisfaction with template suggestions

### **Business Impact**

- 30% reduction in goal creation abandonment
- 25% increase in goal completion rates
- 15% increase in user engagement

## 🚀 **Sprint 3 Execution Plan**

### **Day 1-2 (July 13-14): Foundation**

- [ ] Create template data structures and types
- [ ] Implement initial template collection (10+ templates)
- [ ] Set up template categories system

### **Day 3-4 (July 15-16): UI Development**

- [ ] Build TemplateGallery component
- [ ] Create TemplateCard component
- [ ] Implement search and filtering

### **Day 5-6 (July 17-18): Integration**

- [ ] Integrate templates with GoalInputPage
- [ ] Add template pre-population logic
- [ ] Implement template customization

### **Day 7-8 (July 19-20): Analytics & Polish**

- [ ] Add template usage tracking
- [ ] Implement analytics dashboard
- [ ] Polish UI and user experience

### **Day 9-10 (July 21-22): Testing & Documentation**

- [ ] Comprehensive testing (unit + integration)
- [ ] User acceptance testing
- [ ] Update documentation
- [ ] Prepare for deployment

## 📋 **Future Enhancements (Post-Sprint 3)**

### **Premium Features**

- Custom template creation and sharing
- Advanced template recommendations
- Template collaboration features
- Template marketplace

### **Advanced Analytics**

- Template performance insights
- User behavior analysis
- A/B testing for template effectiveness
- Conversion rate optimization

### **Community Features**

- User-generated templates
- Template rating and reviews
- Template sharing between users
- Community template contests

---

**Document Status**: 📋 **READY FOR SPRINT 3 IMPLEMENTATION**  
**Next Review**: July 13, 2025 (Sprint 3 Start)  
**Owner**: Development Team  
**Priority**: Medium (8 story points)
