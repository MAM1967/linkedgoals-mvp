# LinkedGoals Free Tier Documentation & Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for documenting and implementing LinkedGoals' Free Tier as shown on the marketing site. The Free Tier serves as our primary user acquisition strategy, offering core goal-setting functionality with strategic limitations to encourage Premium upgrades.

## 1. Free Tier Strategy Overview

### 1.1 Business Objectives

- **Primary Goal**: Maximize user acquisition and engagement
- **Secondary Goal**: Create clear upgrade path to Premium
- **Target Conversion Rate**: 3-5% free-to-premium within 90 days
- **User Base Goal**: 10,000+ free users within 6 months

### 1.2 Free Tier Model

**Simple Two-Tier Approach**:

- **Free Tier**: Core functionality with strategic limitations
- **Premium Tier**: Unlimited features and advanced capabilities

## 2. Free Tier Feature Specifications (Based on Marketing Site)

### 2.1 Core Free Features

**Goal Management**

- Set and track up to 3 goals (clearly stated limit)
- Basic goal creation and editing
- Progress tracking with percentage completion
- Goal status updates (not started, in progress, completed)
- Basic milestone creation (up to 2 milestones per goal)

**Dashboard Access**

- Full dashboard access (as advertised)
- Goal overview and progress visualization
- Basic charts and progress indicators
- Goal completion celebrations
- Weekly progress summaries

**Sharing Features (Limited)**

- Limited sharing features (as stated on site)
- Share individual goals publicly (view-only)
- Basic goal visibility to connections
- No collaboration features
- No team sharing capabilities

**Basic User Experience**

- Profile creation and management
- Connect with other users
- View public goals from connections
- Mobile-responsive web interface
- Basic push notifications

### 2.2 Strategic Limitations (Upgrade Drivers)

**Goal Limitations**:

- Maximum 3 active goals (hard limit)
- No goal categories or custom tags
- No advanced goal templates
- No goal archiving or history

**Analytics Limitations**:

- Basic progress tracking only
- No advanced analytics or insights
- No trend analysis or recommendations
- No data export capabilities

**Sharing Limitations**:

- No real-time collaboration
- No team goal management
- No private goal sharing
- No goal assignment features
- No discussion or commenting features

**Support Limitations**:

- Community support only
- FAQ and help documentation
- Email support (72-hour response time)
- No priority support

### 2.3 Upgrade Prompts & Messaging

**3-Goal Limit Messaging**:

- When user has 2 goals: "1 more goal slot available"
- When user reaches 3 goals: "Upgrade to Premium for unlimited goals"
- When trying to create 4th goal: Premium upgrade modal

**Feature Tease Messaging**:

- "See advanced analytics with Premium" (on basic charts)
- "Unlock custom categories with Premium"
- "Get priority support with Premium"
- "Collaborate on goals with Premium"

## 3. User Experience Design

### 3.1 Onboarding Flow

**Step 1: Welcome & Registration** (2 minutes)

- LinkedIn OAuth or email/password signup
- Welcome message explaining Free Tier benefits
- "You get 3 goals to start achieving your dreams!"

**Step 2: First Goal Creation** (3 minutes)

- Guided goal creation wizard
- Simple template selection (5 basic templates)
- Set first milestone
- Progress tracking explanation

**Step 3: Dashboard Tour** (2 minutes)

- "Full dashboard access" feature highlight
- Basic sharing features demonstration
- Introduction to goal tracking tools

### 3.2 Premium Feature Discovery

**Progressive Disclosure**:

- Week 1: Focus on core 3-goal functionality
- Week 2: Show sharing limitations, tease collaboration
- Week 3: Display analytics previews with Premium CTAs
- Week 4: Demonstrate value of unlimited goals

**Contextual Upgrade Prompts**:

- Goal limit reached: "Ready for more? Upgrade to Premium"
- Viewing analytics: "Premium users get detailed insights"
- Sharing attempts: "Collaborate with Premium features"

## 4. Technical Implementation

### 4.1 Database Schema Updates

```sql
-- User plan tracking
ALTER TABLE users ADD COLUMN plan_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN plan_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN goals_count INT DEFAULT 0;

-- Goal limits enforcement
CREATE TABLE plan_limits (
    plan_type VARCHAR(20) PRIMARY KEY,
    max_goals INT NOT NULL,
    max_milestones_per_goal INT NOT NULL,
    analytics_access BOOLEAN DEFAULT FALSE,
    collaboration_access BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE
);

-- Insert plan limits
INSERT INTO plan_limits (plan_type, max_goals, max_milestones_per_goal, analytics_access, collaboration_access, priority_support)
VALUES
    ('free', 3, 2, FALSE, FALSE, FALSE),
    ('premium', -1, -1, TRUE, TRUE, TRUE); -- -1 means unlimited

-- Upgrade prompts tracking
CREATE TABLE upgrade_prompts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    prompt_type VARCHAR(100),
    context VARCHAR(200),
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    clicked BOOLEAN DEFAULT FALSE
);
```

### 4.2 Frontend Components

**Goal Limit Checker**

```tsx
interface GoalLimitProps {
  userPlan: "free" | "premium";
  currentGoalCount: number;
  children: React.ReactNode;
}

export const GoalLimitChecker: React.FC<GoalLimitProps> = ({
  userPlan,
  currentGoalCount,
  children,
}) => {
  const maxGoals = userPlan === "free" ? 3 : Infinity;

  if (userPlan === "premium") {
    return <>{children}</>;
  }

  if (currentGoalCount >= maxGoals) {
    return <GoalLimitReached currentCount={currentGoalCount} />;
  }

  return (
    <>
      {children}
      {currentGoalCount >= 2 && (
        <GoalLimitWarning current={currentGoalCount} max={maxGoals} />
      )}
    </>
  );
};
```

**Goal Limit Warning Component**

```tsx
export const GoalLimitWarning: React.FC<{
  current: number;
  max: number;
}> = ({ current, max }) => {
  const remaining = max - current;

  return (
    <div className="goal-limit-warning">
      <AlertCircle size={16} />
      <span>
        {remaining === 1 ? "1 more goal slot available" : "Goal limit reached"}
      </span>
      <Button variant="link" size="sm">
        Upgrade to Premium
      </Button>
    </div>
  );
};
```

**Goal Limit Reached Component**

```tsx
export const GoalLimitReached: React.FC<{
  currentCount: number;
}> = ({ currentCount }) => {
  return (
    <div className="goal-limit-reached">
      <div className="limit-message">
        <Trophy size={24} />
        <h3>You've reached your 3-goal limit!</h3>
        <p>
          Ready to achieve even more? Upgrade to Premium for unlimited goals.
        </p>
      </div>

      <div className="upgrade-benefits">
        <h4>Premium includes:</h4>
        <ul>
          <li>✓ Unlimited goals</li>
          <li>✓ Advanced analytics</li>
          <li>✓ Custom categories</li>
          <li>✓ Priority support</li>
        </ul>
      </div>

      <div className="upgrade-actions">
        <Button size="lg" onClick={() => router.push("/premium")}>
          Upgrade to Premium
        </Button>
        <Button variant="outline" size="lg">
          Notify Me When Available
        </Button>
      </div>
    </div>
  );
};
```

### 4.3 Backend Services

**Plan Validation Service**

```typescript
export class FreeTierValidationService {
  static async validateGoalCreation(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentCount?: number;
  }> {
    const user = await getUserWithPlan(userId);

    if (user.plan_type === "premium") {
      return { allowed: true };
    }

    const currentGoalCount = await this.getUserGoalCount(userId);

    if (currentGoalCount >= 3) {
      return {
        allowed: false,
        reason: "Free tier limited to 3 goals",
        currentCount: currentGoalCount,
      };
    }

    return { allowed: true, currentCount: currentGoalCount };
  }

  static async getUserGoalCount(userId: string): Promise<number> {
    const result = await db.query(
      `
            SELECT COUNT(*) as count 
            FROM goals 
            WHERE user_id = $1 AND status != 'archived'
        `,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  static async validateFeatureAccess(
    userId: string,
    feature: "analytics" | "collaboration" | "categories"
  ): Promise<boolean> {
    const user = await getUserWithPlan(userId);

    if (user.plan_type === "premium") {
      return true;
    }

    // All advanced features require Premium
    return false;
  }
}
```

**Upgrade Prompt Tracking**

```typescript
export class UpgradePromptService {
  static async trackPromptShown(
    userId: string,
    promptType: string,
    context: string
  ): Promise<void> {
    await db.query(
      `
            INSERT INTO upgrade_prompts (user_id, prompt_type, context)
            VALUES ($1, $2, $3)
        `,
      [userId, promptType, context]
    );
  }

  static async trackPromptClicked(
    userId: string,
    promptType: string
  ): Promise<void> {
    await db.query(
      `
            UPDATE upgrade_prompts 
            SET clicked = TRUE 
            WHERE user_id = $1 AND prompt_type = $2 
            AND shown_at >= CURRENT_DATE
            ORDER BY shown_at DESC 
            LIMIT 1
        `,
      [userId, promptType]
    );
  }

  static async getPromptEffectiveness(): Promise<any> {
    return await db.query(`
            SELECT 
                prompt_type,
                COUNT(*) as shown_count,
                COUNT(*) FILTER (WHERE clicked = TRUE) as clicked_count,
                (COUNT(*) FILTER (WHERE clicked = TRUE)::float / COUNT(*)) * 100 as ctr
            FROM upgrade_prompts
            WHERE shown_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY prompt_type
            ORDER BY ctr DESC
        `);
  }
}
```

## 5. Content Strategy

### 5.1 Free Tier Educational Content

**Getting Started Guides**:

- "Making the Most of Your 3 Goals"
- "How to Choose Your Most Important Goals"
- "Goal Setting Best Practices for Beginners"
- "Track Progress Like a Pro"

**Success Stories**:

- "How Maria Achieved 3 Major Life Goals"
- "From 3 Goals to Life Transformation"
- "Why Starting Small Works: Free Tier Success Stories"

**Feature Tutorials**:

- Video: "Creating Your First Goal"
- Guide: "Using the Full Dashboard"
- Tutorial: "Sharing Your Goals Effectively"

### 5.2 Premium Awareness Content

**Feature Comparison**:

- "Free vs Premium: What You Get"
- Interactive feature comparison table
- "Why Premium Users Achieve 5x More Goals"

**Premium Previews**:

- "Sneak Peek: Advanced Analytics"
- "Coming Soon: Unlimited Goals Preview"
- "Premium Feature Spotlight" email series

## 6. Analytics & Metrics

### 6.1 Key Performance Indicators

**Free Tier Metrics**:

- Free user sign-up rate
- Goal creation rate (goals per user)
- 3-goal limit reached rate
- Dashboard engagement time
- Free tier retention (7-day, 30-day)

**Conversion Metrics**:

- Goal limit upgrade prompt CTR
- Premium interest indication rate
- Email list signup for Premium notifications
- Free-to-premium conversion (when available)

**Engagement Metrics**:

- Average goals per free user
- Goal completion rate
- Dashboard daily active users
- Sharing feature usage rate

### 6.2 Analytics Implementation

**Event Tracking**:

```typescript
// Track goal limit interactions
analytics.track("Goal Limit Reached", {
  userId: user.id,
  currentGoalCount: 3,
  promptShown: true,
  timeToLimit: daysFromSignup,
});

// Track upgrade interest
analytics.track("Premium Interest Shown", {
  userId: user.id,
  trigger: "goal_limit",
  context: "goal_creation_attempt",
});

// Track feature usage
analytics.track("Free Feature Used", {
  userId: user.id,
  feature: "dashboard_access",
  goalCount: user.currentGoals,
  sessionDuration: sessionTime,
});
```

## 7. Marketing Integration

### 7.1 Premium Waitlist

**"Notify Me" Feature**:

- Collect email addresses for Premium launch
- Send progress updates on Premium development
- Early access offers for waitlist subscribers
- Premium feature sneak peeks

**Waitlist Management**:

```typescript
export class PremiumWaitlistService {
  static async addToWaitlist(userId: string, email: string): Promise<void> {
    await db.query(
      `
            INSERT INTO premium_waitlist (user_id, email, added_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO NOTHING
        `,
      [userId, email]
    );

    // Send confirmation email
    await EmailService.sendWaitlistConfirmation(email);
  }

  static async getWaitlistSize(): Promise<number> {
    const result = await db.query(`
            SELECT COUNT(*) as count FROM premium_waitlist
        `);
    return parseInt(result.rows[0].count);
  }
}
```

### 7.2 Social Sharing Integration

**Goal Sharing Features**:

- "Share This Plan" button for Free Tier
- LinkedIn integration for goal announcements
- Success story sharing with LinkedGoals attribution
- Referral tracking for free users

## 8. Support Strategy

### 8.1 Free Tier Support

**Self-Service Resources**:

- Comprehensive FAQ focused on 3-goal limit
- Video tutorials for core features
- Community forum for user questions
- Email support with 72-hour response time

**Proactive Support**:

- Onboarding email sequence (5 emails over 2 weeks)
- Goal completion congratulations
- Weekly tips for maximizing 3 goals
- Monthly feature update newsletters

### 8.2 Premium Support Differentiation

**When Premium Launches**:

- Priority email support (24-hour response)
- Live chat for Premium users
- Phone support for complex issues
- Dedicated success manager for enterprise

## 9. Implementation Timeline

### Phase 1: Core Free Tier (Weeks 1-4)

- Implement 3-goal limit enforcement
- Create goal limit warning/reached components
- Set up basic analytics tracking
- Develop "full dashboard access" features

### Phase 2: Upgrade Prompts (Weeks 5-6)

- Build upgrade prompt system
- Create Premium feature preview pages
- Implement "Notify Me" waitlist functionality
- Set up prompt effectiveness tracking

### Phase 3: Content & Support (Weeks 7-8)

- Create educational content for Free Tier
- Set up community support system
- Develop email sequences for onboarding
- Launch social sharing features

### Phase 4: Optimization (Weeks 9-12)

- A/B test upgrade prompt messaging
- Optimize goal limit user experience
- Refine dashboard engagement features
- Prepare for Premium launch

## 10. Success Criteria

### 10.1 3-Month Goals

- 1,000+ Free Tier users signed up
- 80%+ users create at least 1 goal
- 40%+ users reach 3-goal limit
- 50%+ 30-day user retention
- 500+ Premium waitlist signups

### 10.2 6-Month Goals (Pre-Premium Launch)

- 5,000+ Free Tier users
- 60%+ users reach 3-goal limit
- 60%+ 30-day retention
- 2,000+ Premium waitlist signups
- 70%+ goal completion rate among active users

## 11. Risk Mitigation

### 11.1 User Experience Risks

- **3-Goal Limit Frustration**: Clear messaging about limit from onboarding
- **Feature Discovery**: Guided tours and progressive disclosure
- **Engagement Drop**: Regular content and community features

### 11.2 Business Risks

- **Low Premium Interest**: Multiple touchpoints for Premium awareness
- **High Support Costs**: Comprehensive self-service resources
- **User Churn**: Focus on goal completion and success

## 12. Premium Launch Preparation

### 12.1 Waitlist Conversion Strategy

- Early access for most engaged Free Tier users
- Special launch pricing for waitlist subscribers
- Grandfathered features for early adopters
- Seamless upgrade process design

### 12.2 Free-to-Premium Migration

- Data migration planning for existing goals
- Feature unlock notifications
- Upgrade celebration and onboarding
- Retention tracking for converted users

---

**Document Owner**: Product Management Team  
**Last Updated**: [Current Date]  
**Next Review**: Bi-weekly during implementation  
**Status**: Aligned with Marketing Site
