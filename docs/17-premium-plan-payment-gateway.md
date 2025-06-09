# LinkedGoals Premium Plan & Payment Gateway Implementation

## Executive Summary

This document outlines the comprehensive plan for implementing LinkedGoals' Premium plan with full payment gateway integration, based on the features advertised on the marketing site. The Premium plan will provide unlimited goals, advanced analytics, custom categories, and priority support while establishing a sustainable revenue model through Stripe-powered subscription management.

## 1. Premium Plan Strategy Overview

### 1.1 Business Objectives

- **Primary Goal**: Generate sustainable recurring revenue from Premium subscriptions
- **Secondary Goal**: Provide exceptional value for committed goal achievers
- **Target Revenue**: $25,000 MRR within 12 months of launch
- **Target Conversion**: 5% of Free Tier users within 6 months

### 1.2 Premium Plan Structure (Based on Marketing Site)

**Single Premium Tier** - Coming Soon

- **Target Audience**: Serious goal achievers and productivity enthusiasts
- **Value Proposition**: Remove all limitations and unlock advanced features
- **Pricing Strategy**: Simple, transparent pricing (to be determined)

## 2. Premium Feature Specifications (From Marketing Site)

### 2.1 Premium Features Overview

**Unlimited Goals**

- Remove the 3-goal limitation from Free Tier
- Create unlimited active goals
- No restrictions on goal categories or complexity
- Goal archiving and comprehensive history
- Bulk goal operations and management

**Advanced Analytics**

- Detailed progress reports and insights
- Goal completion patterns and trends analysis
- Productivity metrics and recommendations
- Goal performance comparisons over time
- Weekly, monthly, and quarterly reports
- Data visualization with charts and graphs
- Progress prediction and forecasting
- Goal ROI and impact tracking
- Data export capabilities (CSV, PDF)

**Custom Categories**

- Create unlimited custom goal categories
- Personal categorization system
- Color-coded category organization
- Category-based filtering and sorting
- Category performance analytics
- Tag-based goal organization
- Smart categorization suggestions

**Priority Support**

- 24-hour response time guarantee
- Dedicated premium support channel
- Live chat support availability
- Phone support for complex issues
- Priority feature request consideration
- Direct access to product team
- Personalized onboarding assistance

### 2.2 Enhanced User Experience

**Premium Dashboard**

- Advanced dashboard with customizable widgets
- Real-time progress tracking across all goals
- Personalized insights and recommendations
- Achievement badges and milestone celebrations
- Advanced filtering and search capabilities
- Customizable goal views and layouts

**Collaboration Features (Future)**

- Share goals with accountability partners
- Collaborative goal planning and tracking
- Team goal management capabilities
- Goal commenting and discussion threads
- Progress sharing and updates

**Productivity Integrations**

- Calendar integration (Google Calendar, Outlook)
- Task management system integration
- Habit tracking and formation tools
- Reminder and notification customization
- Mobile app with offline sync capabilities

## 3. Payment Gateway Implementation

### 3.1 Stripe Integration Architecture

**Core Payment Components**:

- Stripe Checkout for subscription creation
- Stripe Customer Portal for self-service billing
- Webhook handling for real-time updates
- Subscription lifecycle management
- Payment method management

**Database Schema**:

```sql
-- Premium subscriptions
CREATE TABLE premium_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'active', 'trialing', 'canceled', 'past_due'
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'card', 'ach', etc.
    card_brand VARCHAR(50),
    card_last_four VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing history
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    amount_paid INT NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    invoice_pdf VARCHAR(255),
    billing_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Premium waitlist (for "Coming Soon" period)
CREATE TABLE premium_waitlist (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP,
    converted_at TIMESTAMP,
    UNIQUE(user_id)
);
```

### 3.2 Stripe Product Configuration

**Premium Subscription Setup**:

```typescript
// Stripe product configuration
export const PREMIUM_PRICING = {
  monthly: {
    priceId: "price_premium_monthly",
    amount: 999, // $9.99 (example pricing)
    interval: "month",
    trial_period_days: 14,
  },
  yearly: {
    priceId: "price_premium_yearly",
    amount: 9900, // $99.00 (example pricing - 17% discount)
    interval: "year",
    trial_period_days: 14,
  },
};

// Product features mapping
export const PREMIUM_FEATURES = {
  unlimited_goals: true,
  advanced_analytics: true,
  custom_categories: true,
  priority_support: true,
  data_export: true,
  calendar_integration: true,
  mobile_app: true,
  collaboration: false, // Coming in future release
};
```

### 3.3 Subscription Creation Flow

**Premium Checkout Service**:

```typescript
export class PremiumCheckoutService {
  static async createSubscription(
    userId: string,
    interval: "month" | "year",
    paymentMethodId?: string
  ) {
    try {
      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId);

      // Create subscription with trial
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: PREMIUM_PRICING[interval].priceId,
          },
        ],
        trial_period_days: 14,
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId: userId,
          planType: "premium",
        },
      });

      // Save to database
      await this.saveSubscription(userId, subscription);

      // Update user plan
      await this.upgradeUserToPremium(userId);

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        trialEnd: new Date(subscription.trial_end * 1000),
      };
    } catch (error) {
      throw new PaymentError("Failed to create premium subscription", error);
    }
  }

  static async upgradeUserToPremium(userId: string) {
    await db.query(
      `
            UPDATE users 
            SET plan_type = 'premium', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `,
      [userId]
    );

    // Remove goal limitations
    await this.unlockPremiumFeatures(userId);

    // Send welcome email
    await EmailService.sendPremiumWelcome(userId);

    // Track upgrade event
    await Analytics.track("Premium Upgrade", {
      userId: userId,
      source: "goal_limit",
    });
  }
}
```

### 3.4 Premium Checkout Components

**Premium Upgrade Modal**:

```tsx
interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: "goal_limit" | "analytics" | "categories";
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  trigger,
}) => {
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">(
    "month"
  );
  const [loading, setLoading] = useState(false);

  const features = [
    { icon: "🎯", text: "Unlimited goals" },
    { icon: "📊", text: "Advanced analytics" },
    { icon: "🏷️", text: "Custom categories" },
    { icon: "⚡", text: "Priority support" },
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { clientSecret } = await PremiumCheckoutService.createSubscription(
        user.id,
        selectedInterval
      );

      // Redirect to Stripe Checkout or handle payment
      router.push(`/checkout?client_secret=${clientSecret}`);
    } catch (error) {
      setError("Failed to start upgrade process");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="premium-upgrade-modal">
        <div className="modal-header">
          <h2>Upgrade to Premium</h2>
          <span className="coming-soon-badge">Available Soon!</span>
        </div>

        <div className="upgrade-reason">
          {trigger === "goal_limit" && (
            <p>
              You've reached your 3-goal limit. Upgrade for unlimited goals!
            </p>
          )}
          {trigger === "analytics" && (
            <p>
              Unlock detailed insights about your progress patterns and trends!
            </p>
          )}
          {trigger === "categories" && (
            <p>Organize your goals your way with custom categories and tags!</p>
          )}
        </div>

        <div className="features-list">
          <h3>Premium includes:</h3>
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="feature-icon">{feature.icon}</span>
              <span className="feature-text">{feature.text}</span>
            </div>
          ))}
        </div>

        <div className="pricing-options">
          <div className="interval-selector">
            <button
              className={`interval-btn ${
                selectedInterval === "month" ? "active" : ""
              }`}
              onClick={() => setSelectedInterval("month")}
            >
              Monthly
              <span className="price">$9.99/month</span>
            </button>
            <button
              className={`interval-btn ${
                selectedInterval === "year" ? "active" : ""
              }`}
              onClick={() => setSelectedInterval("year")}
            >
              Yearly
              <span className="price">$99/year</span>
              <span className="savings">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="trial-info">
          <p>✨ Start with a 14-day free trial</p>
        </div>

        <div className="modal-actions">
          <Button
            size="lg"
            onClick={handleUpgrade}
            disabled={loading}
            className="upgrade-button"
          >
            {loading ? "Starting Trial..." : "Start Free Trial"}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              // Add to waitlist
              PremiumWaitlistService.addToWaitlist(user.id, user.email);
              onClose();
            }}
          >
            Notify Me When Available
          </Button>
        </div>

        <p className="terms-text">
          By upgrading, you agree to our <a href="/terms">Terms of Service</a>
        </p>
      </div>
    </Modal>
  );
};
```

**Premium Features Preview**:

```tsx
export const PremiumFeaturesPreview: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState("unlimited_goals");

  const featurePreviews = {
    unlimited_goals: {
      title: "Unlimited Goals",
      description: "Create as many goals as you need. No more 3-goal limit.",
      preview: <UnlimitedGoalsPreview />,
    },
    advanced_analytics: {
      title: "Advanced Analytics",
      description: "Deep insights into your progress patterns and trends.",
      preview: <AnalyticsPreview />,
    },
    custom_categories: {
      title: "Custom Categories",
      description: "Organize goals your way with custom categories and tags.",
      preview: <CategoriesPreview />,
    },
    priority_support: {
      title: "Priority Support",
      description: "24-hour response time and direct access to our team.",
      preview: <SupportPreview />,
    },
  };

  return (
    <div className="premium-features-preview">
      <h2>Premium Features</h2>

      <div className="feature-tabs">
        {Object.entries(featurePreviews).map(([key, feature]) => (
          <button
            key={key}
            className={`feature-tab ${activeFeature === key ? "active" : ""}`}
            onClick={() => setActiveFeature(key)}
          >
            {feature.title}
          </button>
        ))}
      </div>

      <div className="feature-content">
        <div className="feature-description">
          <h3>{featurePreviews[activeFeature].title}</h3>
          <p>{featurePreviews[activeFeature].description}</p>
        </div>

        <div className="feature-preview">
          {featurePreviews[activeFeature].preview}
        </div>
      </div>

      <div className="upgrade-cta">
        <Button size="lg" onClick={() => setShowUpgradeModal(true)}>
          Upgrade to Premium
        </Button>
        <p>14-day free trial • Cancel anytime</p>
      </div>
    </div>
  );
};
```

## 4. Webhook Management

### 4.1 Subscription Lifecycle Webhooks

**Webhook Handler Service**:

```typescript
export class PremiumWebhookService {
  static async handleStripeWebhook(payload: string, signature: string) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error("Invalid webhook signature");
    }

    switch (event.type) {
      case "customer.subscription.created":
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionCanceled(event.data.object);
        break;

      case "customer.subscription.trial_will_end":
        await this.handleTrialWillEnd(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private static async handleSubscriptionCreated(subscription: any) {
    const userId = subscription.metadata.userId;

    await db.query(
      `
            INSERT INTO premium_subscriptions (
                user_id, stripe_subscription_id, stripe_customer_id,
                status, current_period_start, current_period_end,
                trial_start, trial_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
      [
        userId,
        subscription.id,
        subscription.customer,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      ]
    );

    // Send trial started email
    await EmailService.sendTrialStarted(userId);
  }

  private static async handleTrialWillEnd(subscription: any) {
    const userId = subscription.metadata.userId;

    // Send trial ending reminder
    await EmailService.sendTrialEndingReminder(userId, subscription.trial_end);

    // Track trial conversion opportunity
    await Analytics.track("Trial Ending Soon", {
      userId: userId,
      daysLeft: Math.ceil(
        (subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    });
  }

  private static async handleSubscriptionCanceled(subscription: any) {
    const userId = subscription.metadata.userId;

    // Downgrade user to free tier
    await this.downgradeToFreeTier(userId);

    // Send cancellation confirmation
    await EmailService.sendCancellationConfirmation(userId);

    // Track churn
    await Analytics.track("Premium Canceled", {
      userId: userId,
      reason: "subscription_canceled",
    });
  }

  private static async downgradeToFreeTier(userId: string) {
    // Update user plan
    await db.query(
      `
            UPDATE users 
            SET plan_type = 'free', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `,
      [userId]
    );

    // Enforce free tier limitations
    await this.enforceFreeTierLimits(userId);
  }
}
```

## 5. Premium Features Implementation

### 5.1 Unlimited Goals Feature

**Goal Management Service**:

```typescript
export class PremiumGoalService {
  static async createGoal(userId: string, goalData: any) {
    // Check if user has premium access
    const userPlan = await getUserPlan(userId);

    if (userPlan.plan_type === "free") {
      // Enforce 3-goal limit for free users
      const goalCount = await this.getUserGoalCount(userId);
      if (goalCount >= 3) {
        throw new GoalLimitError("Free tier limited to 3 goals");
      }
    }

    // Premium users have unlimited goals
    const goal = await db.query(
      `
            INSERT INTO goals (user_id, title, description, category_id, target_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `,
      [
        userId,
        goalData.title,
        goalData.description,
        goalData.categoryId,
        goalData.targetDate,
      ]
    );

    return goal.rows[0];
  }

  static async getUserGoals(userId: string) {
    const userPlan = await getUserPlan(userId);

    let query = `
            SELECT g.*, c.name as category_name, c.color as category_color
            FROM goals g
            LEFT JOIN categories c ON c.id = g.category_id
            WHERE g.user_id = $1 AND g.status != 'archived'
        `;

    if (userPlan.plan_type === "free") {
      query += ` LIMIT 3`;
    }

    query += ` ORDER BY g.created_at DESC`;

    const goals = await db.query(query, [userId]);
    return goals.rows;
  }
}
```

### 5.2 Advanced Analytics Implementation

**Analytics Service**:

```typescript
export class PremiumAnalyticsService {
  static async getAdvancedAnalytics(userId: string, timeRange: DateRange) {
    // Verify premium access
    const userPlan = await getUserPlan(userId);
    if (userPlan.plan_type !== "premium") {
      throw new FeatureAccessError("Advanced analytics requires Premium");
    }

    const analytics = await Promise.all([
      this.getGoalCompletionTrends(userId, timeRange),
      this.getProductivityMetrics(userId, timeRange),
      this.getCategoryPerformance(userId, timeRange),
      this.getGoalVelocity(userId, timeRange),
      this.getPredictiveInsights(userId),
    ]);

    return {
      completionTrends: analytics[0],
      productivityMetrics: analytics[1],
      categoryPerformance: analytics[2],
      goalVelocity: analytics[3],
      predictiveInsights: analytics[4],
    };
  }

  private static async getGoalCompletionTrends(
    userId: string,
    timeRange: DateRange
  ) {
    return await db.query(
      `
            SELECT 
                DATE_TRUNC('week', completed_at) as week,
                COUNT(*) as completed_goals,
                AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_completion_days
            FROM goals
            WHERE user_id = $1 
            AND completed_at BETWEEN $2 AND $3
            AND status = 'completed'
            GROUP BY week
            ORDER BY week
        `,
      [userId, timeRange.start, timeRange.end]
    );
  }

  private static async getProductivityMetrics(
    userId: string,
    timeRange: DateRange
  ) {
    return await db.query(
      `
            SELECT 
                COUNT(DISTINCT DATE(created_at)) as active_days,
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
                AVG(progress_percentage) as avg_progress,
                COUNT(*) FILTER (WHERE target_date < CURRENT_DATE AND status != 'completed') as overdue_goals
            FROM goals
            WHERE user_id = $1
            AND created_at BETWEEN $2 AND $3
        `,
      [userId, timeRange.start, timeRange.end]
    );
  }

  static async exportAnalyticsData(userId: string, format: "csv" | "pdf") {
    // Verify premium access
    const userPlan = await getUserPlan(userId);
    if (userPlan.plan_type !== "premium") {
      throw new FeatureAccessError("Data export requires Premium");
    }

    const data = await this.getExportableData(userId);

    if (format === "csv") {
      return this.generateCSV(data);
    } else {
      return this.generatePDF(data);
    }
  }
}
```

### 5.3 Custom Categories Implementation

**Category Management Service**:

```typescript
export class PremiumCategoryService {
  static async createCustomCategory(userId: string, categoryData: any) {
    // Verify premium access
    const userPlan = await getUserPlan(userId);
    if (userPlan.plan_type !== "premium") {
      throw new FeatureAccessError("Custom categories require Premium");
    }

    const category = await db.query(
      `
            INSERT INTO categories (user_id, name, color, icon, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `,
      [
        userId,
        categoryData.name,
        categoryData.color,
        categoryData.icon,
        categoryData.description,
      ]
    );

    return category.rows[0];
  }

  static async getUserCategories(userId: string) {
    const userPlan = await getUserPlan(userId);

    let query = `
            SELECT c.*, COUNT(g.id) as goal_count
            FROM categories c
            LEFT JOIN goals g ON g.category_id = c.id AND g.status != 'archived'
            WHERE c.user_id = $1 OR c.user_id IS NULL
        `;

    if (userPlan.plan_type === "free") {
      // Free users only get default categories
      query += ` AND c.user_id IS NULL`;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const categories = await db.query(query, [userId]);
    return categories.rows;
  }

  static async getCategoryAnalytics(userId: string, categoryId: string) {
    // Verify premium access
    const userPlan = await getUserPlan(userId);
    if (userPlan.plan_type !== "premium") {
      throw new FeatureAccessError("Category analytics require Premium");
    }

    return await db.query(
      `
            SELECT 
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
                AVG(progress_percentage) as avg_progress,
                AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - created_at)) / 86400) as avg_duration_days
            FROM goals
            WHERE user_id = $1 AND category_id = $2
        `,
      [userId, categoryId]
    );
  }
}
```

## 6. Customer Support Implementation

### 6.1 Priority Support System

**Support Ticket Service**:

```typescript
export class PremiumSupportService {
  static async createSupportTicket(userId: string, ticketData: any) {
    const userPlan = await getUserPlan(userId);
    const priority = userPlan.plan_type === "premium" ? "high" : "normal";
    const sla = userPlan.plan_type === "premium" ? 24 : 72; // hours

    const ticket = await db.query(
      `
            INSERT INTO support_tickets (
                user_id, subject, description, priority, sla_hours, status
            ) VALUES ($1, $2, $3, $4, $5, 'open')
            RETURNING *
        `,
      [userId, ticketData.subject, ticketData.description, priority, sla]
    );

    // Send immediate response based on plan
    if (userPlan.plan_type === "premium") {
      await this.sendPremiumSupportResponse(userId, ticket.rows[0]);
    } else {
      await this.sendStandardSupportResponse(userId, ticket.rows[0]);
    }

    return ticket.rows[0];
  }

  private static async sendPremiumSupportResponse(userId: string, ticket: any) {
    await EmailService.sendEmail({
      to: ticket.email,
      subject: `[PRIORITY] Support Ticket #${ticket.id} - ${ticket.subject}`,
      template: "premium_support_created",
      data: {
        ticketId: ticket.id,
        expectedResponse: "24 hours",
        supportType: "priority",
      },
    });
  }
}
```

## 7. Billing & Subscription Management

### 7.1 Customer Portal Integration

**Billing Portal Service**:

```typescript
export class PremiumBillingService {
  static async createBillingPortalSession(userId: string, returnUrl: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No premium subscription found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return session.url;
  }

  static async getSubscriptionDetails(userId: string) {
    const subscription = await db.query(
      `
            SELECT ps.*, pm.card_brand, pm.card_last_four
            FROM premium_subscriptions ps
            LEFT JOIN payment_methods pm ON pm.user_id = ps.user_id AND pm.is_default = true
            WHERE ps.user_id = $1 AND ps.status IN ('active', 'trialing')
        `,
      [userId]
    );

    if (subscription.rows.length === 0) {
      return null;
    }

    const sub = subscription.rows[0];
    return {
      ...sub,
      isTrialing: sub.status === "trialing",
      trialEndsAt: sub.trial_end,
      nextBillingDate: sub.current_period_end,
      canCancel: true,
    };
  }

  static async cancelSubscription(userId: string, immediate: boolean = false) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    if (immediate) {
      await stripe.subscriptions.del(subscription.stripe_subscription_id);
      await this.downgradeToFreeTier(userId);
    } else {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Update database
    await db.query(
      `
            UPDATE premium_subscriptions 
            SET cancel_at_period_end = $1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
        `,
      [!immediate, userId]
    );

    return {
      immediate,
      effectiveDate: immediate ? new Date() : subscription.current_period_end,
    };
  }
}
```

## 8. Marketing & Launch Strategy

### 8.1 "Coming Soon" Campaign

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
    await EmailService.sendEmail({
      to: email,
      subject: "You're on the Premium waitlist!",
      template: "premium_waitlist_confirmation",
      data: {
        userName: await this.getUserName(userId),
        estimatedLaunch: "Q2 2024",
      },
    });

    // Track waitlist signup
    await Analytics.track("Premium Waitlist Signup", {
      userId: userId,
      source: "goal_limit_modal",
    });
  }

  static async getWaitlistSize(): Promise<number> {
    const result = await db.query(`
            SELECT COUNT(*) as count FROM premium_waitlist
        `);
    return parseInt(result.rows[0].count);
  }

  static async notifyWaitlistOfLaunch() {
    const waitlistUsers = await db.query(`
            SELECT pw.*, u.name 
            FROM premium_waitlist pw
            JOIN users u ON u.id = pw.user_id
            WHERE pw.notified_at IS NULL
            ORDER BY pw.added_at ASC
        `);

    for (const user of waitlistUsers.rows) {
      await EmailService.sendEmail({
        to: user.email,
        subject: "Premium is here! Your early access is ready",
        template: "premium_launch_notification",
        data: {
          userName: user.name,
          earlyAccessDiscount: "20%",
          accessCode: this.generateEarlyAccessCode(user.user_id),
        },
      });

      // Mark as notified
      await db.query(
        `
                UPDATE premium_waitlist 
                SET notified_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `,
        [user.id]
      );
    }
  }
}
```

### 8.2 Launch Sequence

**Early Access Program**:

```typescript
export class EarlyAccessService {
  static async createEarlyAccessOffer(userId: string) {
    // Generate special pricing for early adopters
    const discountPercent = 20; // 20% off first 3 months

    const earlyAccessOffer = await stripe.promotionCodes.create({
      coupon: "early_access_20_off",
      code: `EARLY${userId.slice(-6).toUpperCase()}`,
      max_redemptions: 1,
      restrictions: {
        first_time_transaction: true,
      },
      metadata: {
        userId: userId,
        offerType: "early_access",
      },
    });

    return earlyAccessOffer.code;
  }

  static async convertWaitlistUser(userId: string, promoCode?: string) {
    // Special onboarding for waitlist converts
    await this.unlockEarlyAccessFeatures(userId);

    // Track conversion
    await Analytics.track("Waitlist Converted", {
      userId: userId,
      hadPromoCode: !!promoCode,
      timeOnWaitlist: await this.getWaitlistDuration(userId),
    });
  }
}
```

## 9. Success Metrics & Analytics

### 9.1 Key Performance Indicators

**Revenue Metrics**:

- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (CLV)
- Average Revenue Per User (ARPU)

**Conversion Metrics**:

- Free-to-Premium conversion rate
- Trial-to-paid conversion rate
- Waitlist-to-customer conversion rate
- Feature-specific upgrade triggers

**Engagement Metrics**:

- Premium feature adoption rates
- Goal creation frequency (unlimited vs limited)
- Analytics feature usage
- Support ticket satisfaction scores

### 9.2 Analytics Implementation

**Revenue Tracking**:

```typescript
export class RevenueAnalytics {
  static async getMRR(date: Date = new Date()): Promise<number> {
    const result = await db.query(
      `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN interval = 'month' THEN amount
                        WHEN interval = 'year' THEN amount / 12
                    END
                ), 0) as mrr
            FROM premium_subscriptions ps
            JOIN invoices i ON i.user_id = ps.user_id
            WHERE ps.status = 'active'
            AND ps.created_at <= $1
        `,
      [date]
    );

    return parseFloat(result.rows[0].mrr) / 100; // Convert from cents
  }

  static async getConversionFunnel(): Promise<any> {
    return await db.query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.plan_type = 'free' THEN u.id END) as free_users,
                COUNT(DISTINCT ps.user_id) as premium_users,
                COUNT(DISTINCT pw.user_id) as waitlist_users
            FROM users u
            LEFT JOIN premium_subscriptions ps ON ps.user_id = u.id AND ps.status = 'active'
            LEFT JOIN premium_waitlist pw ON pw.user_id = u.id
        `);
  }
}
```

## 10. Implementation Timeline

### Phase 1: Infrastructure (Weeks 1-3)

- Set up Stripe integration and webhooks
- Implement subscription management system
- Create premium feature access controls
- Set up billing portal and customer management

### Phase 2: Core Features (Weeks 4-6)

- Implement unlimited goals functionality
- Build advanced analytics dashboard
- Create custom categories system
- Set up priority support workflows

### Phase 3: User Experience (Weeks 7-8)

- Design and implement premium upgrade flows
- Create feature preview and teaser components
- Build waitlist management system
- Develop premium onboarding experience

### Phase 4: Testing & Launch (Weeks 9-10)

- Comprehensive payment flow testing
- Security audit and compliance review
- Beta testing with waitlist users
- Premium plan public launch

## 11. Risk Mitigation

### 11.1 Technical Risks

- **Payment Processing Failures**: Comprehensive error handling and retry logic
- **Data Security**: PCI compliance and data encryption
- **System Scalability**: Load testing and performance optimization

### 11.2 Business Risks

- **Low Conversion Rates**: Multiple upgrade triggers and value demonstration
- **Feature Adoption**: Progressive disclosure and user education
- **Customer Churn**: Strong onboarding and customer success programs

## 12. Success Criteria

### 12.1 Launch Goals (First 3 Months)

- 500+ Premium subscribers
- 15%+ free-to-premium conversion rate
- $5,000+ MRR
- 95%+ payment success rate
- <5% monthly churn rate

### 12.2 Growth Goals (First 12 Months)

- 2,000+ Premium subscribers
- $25,000+ MRR
- 90%+ customer satisfaction score
- 20%+ annual plan adoption rate
- Positive unit economics (LTV > 3x CAC)

---

**Document Owner**: Product & Engineering Teams  
**Last Updated**: [Current Date]  
**Next Review**: Weekly during implementation, monthly post-launch  
**Status**: Aligned with Marketing Site - Ready for Development
