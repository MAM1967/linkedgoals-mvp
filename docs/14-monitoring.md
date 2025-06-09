# Monitoring & Observability

This document describes the comprehensive monitoring and observability setup for the LinkedGoals MVP application.

## Table of Contents

- [Key Metrics](#key-metrics)
- [Alert Thresholds and Escalation](#alert-thresholds-and-escalation)
- [Log Aggregation and Search](#log-aggregation-and-search)
- [Performance Monitoring Tools](#performance-monitoring-tools)
- [User Analytics and Tracking](#user-analytics-and-tracking)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Error Tracking and Debugging](#error-tracking-and-debugging)
- [Business Metrics](#business-metrics)

## Key Metrics

### Application Performance Metrics

#### **Frontend Performance**

| Metric                   | Target  | Critical | Tool                    |
| ------------------------ | ------- | -------- | ----------------------- |
| First Contentful Paint   | < 1.5s  | > 3.0s   | Firebase Performance    |
| Largest Contentful Paint | < 2.5s  | > 4.0s   | Lighthouse, CrUX        |
| Cumulative Layout Shift  | < 0.1   | > 0.25   | Core Web Vitals         |
| First Input Delay        | < 100ms | > 300ms  | Real User Monitoring    |
| Time to Interactive      | < 3.5s  | > 6.0s   | Firebase Performance    |
| Bundle Size              | < 1MB   | > 2MB    | webpack-bundle-analyzer |

#### **Backend Performance**

| Metric                  | Target  | Critical | Tool                    |
| ----------------------- | ------- | -------- | ----------------------- |
| Cloud Function Duration | < 500ms | > 2s     | Firebase Console        |
| Cold Start Time         | < 1s    | > 3s     | Google Cloud Monitoring |
| Function Success Rate   | > 99.5% | < 95%    | Firebase Functions      |
| Firestore Query Time    | < 200ms | > 1s     | Firebase Console        |
| Authentication Response | < 300ms | > 1s     | Firebase Auth           |

#### **System Resources**

| Metric                     | Target     | Critical | Tool               |
| -------------------------- | ---------- | -------- | ------------------ |
| Function Memory Usage      | < 80%      | > 95%    | Cloud Functions    |
| Firestore Read Operations  | < 100k/day | > 500k   | Firebase Console   |
| Firestore Write Operations | < 50k/day  | > 200k   | Firebase Usage     |
| Bandwidth Usage            | < 10GB/day | > 50GB   | Firebase Hosting   |
| Function Invocations       | < 1M/month | > 5M     | Firebase Functions |

### User Experience Metrics

#### **Core Application Metrics**

| Metric                      | Target | Critical | Tracking Method   |
| --------------------------- | ------ | -------- | ----------------- |
| Goal Creation Success Rate  | > 95%  | < 85%    | Custom Events     |
| Login Success Rate          | > 98%  | < 90%    | Firebase Auth     |
| Page Load Error Rate        | < 1%   | > 5%     | JavaScript Errors |
| Mobile Responsiveness Score | > 90   | < 70     | Lighthouse Mobile |
| User Session Duration       | > 5min | < 2min   | Google Analytics  |

## Alert Thresholds and Escalation

### Alert Categories

#### **Critical Alerts (P0)**

- **Response Time**: 15 minutes
- **Escalation**: Immediate phone/SMS notification
- **Conditions**:
  - Application completely down
  - Authentication system failure
  - Data corruption detected
  - Security breach indicators

#### **High Priority Alerts (P1)**

- **Response Time**: 1 hour
- **Escalation**: Slack + Email notification
- **Conditions**:
  - Error rate > 5% for 10 minutes
  - Response time > 5 seconds for 5 minutes
  - Function failure rate > 10%
  - Database connection issues

#### **Medium Priority Alerts (P2)**

- **Response Time**: 4 hours (business hours)
- **Escalation**: Slack notification
- **Conditions**:
  - Performance degradation (2x baseline)
  - High resource usage (> 80%)
  - Unusual traffic patterns
  - Third-party service issues

#### **Low Priority Alerts (P3)**

- **Response Time**: 24 hours
- **Escalation**: Email notification
- **Conditions**:
  - Performance trends trending negative
  - Capacity planning warnings
  - Non-critical feature issues

### Escalation Procedures

#### **Alert Routing**

```yaml
# Escalation matrix
Primary On-Call: Lead Developer
  - Phone: +1-XXX-XXX-XXXX
  - Slack: @lead-developer
  - Email: lead@linkedgoals.app

Secondary On-Call: DevOps Engineer
  - Phone: +1-XXX-XXX-XXXX
  - Slack: @devops-engineer
  - Email: devops@linkedgoals.app

Fallback: Product Manager
  - Email: product@linkedgoals.app
```

#### **Alert Acknowledgment Process**

1. **Immediate Acknowledgment** (within 15 minutes for P0)
2. **Status Update** (every 30 minutes during incident)
3. **Resolution Confirmation** (functional verification)
4. **Post-Incident Report** (within 24 hours)

## Log Aggregation and Search

### Logging Architecture

#### **Frontend Logging**

```typescript
// Structured logging implementation
interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  context?: any;
}

class Logger {
  private sessionId = crypto.randomUUID();

  info(message: string, context?: any) {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
    };

    console.log(JSON.stringify(entry));
    this.sendToRemote(entry);
  }

  error(message: string, error?: Error, context?: any) {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: {
        ...context,
        error: error?.message,
        stack: error?.stack,
      },
    };

    console.error(JSON.stringify(entry));
    this.sendToRemote(entry);
  }

  private sendToRemote(entry: LogEntry) {
    // Send to Firebase Functions for processing
    if (entry.level === "error") {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    }
  }
}
```

#### **Backend Logging**

```typescript
// Cloud Functions structured logging
import { logger } from "firebase-functions/v2";

export const loggedFunction = onRequest(async (req, res) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  logger.info("Function started", {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.headers["user-agent"],
  });

  try {
    const result = await processRequest(req);
    const duration = Date.now() - startTime;

    logger.info("Function completed", {
      requestId,
      duration,
      resultSize: JSON.stringify(result).length,
    });

    res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Function failed", {
      requestId,
      duration,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Log Query Examples

#### **Google Cloud Logging Queries**

```sql
-- Find all authentication errors
resource.type="cloud_function"
resource.labels.function_name="linkedinlogin"
severity="ERROR"
timestamp >= "2024-01-01T00:00:00Z"

-- Performance analysis
resource.type="cloud_function"
jsonPayload.duration > 1000
timestamp >= "2024-01-01T00:00:00Z"

-- User session analysis
resource.type="cloud_function"
jsonPayload.userId="specific-user-id"
timestamp >= "2024-01-01T00:00:00Z"
```

#### **Firebase Console Queries**

```bash
# Function-specific logs
firebase functions:log --only linkedinlogin --lines 100

# Filter by severity
firebase functions:log --only linkedinlogin | grep ERROR

# Real-time monitoring
firebase functions:log --only linkedinlogin --follow
```

## Performance Monitoring Tools

### Firebase Performance Monitoring

#### **Automatic Metrics Collection**

```typescript
// Initialize Firebase Performance
import { getPerformance } from "firebase/performance";

const perf = getPerformance();

// Automatic collection includes:
// - Page load times
// - Network request times
// - App startup time
// - Custom traces
```

#### **Custom Performance Traces**

```typescript
// Track custom operations
import { trace } from "firebase/performance";

export const performanceTracker = {
  trackGoalCreation: async (goalData: any) => {
    const goalTrace = trace(perf, "goal_creation_flow");
    goalTrace.start();

    try {
      goalTrace.putAttribute("category", goalData.category);
      goalTrace.putAttribute(
        "has_deadline",
        goalData.deadline ? "true" : "false"
      );

      const result = await createGoal(goalData);

      goalTrace.putAttribute("success", "true");
      goalTrace.incrementMetric("goals_created", 1);

      return result;
    } catch (error) {
      goalTrace.putAttribute("success", "false");
      goalTrace.putAttribute("error", error.message);
      throw error;
    } finally {
      goalTrace.stop();
    }
  },

  trackPageLoad: (pageName: string) => {
    const pageTrace = trace(perf, `page_${pageName}_load`);
    pageTrace.start();

    // Stop trace when page is fully loaded
    window.addEventListener("load", () => {
      pageTrace.stop();
    });

    return pageTrace;
  },
};
```

### Lighthouse CI Integration

#### **Automated Performance Testing**

```yaml
# GitHub Actions Lighthouse CI
name: Performance Audit
on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --upload.target=temporary-public-storage
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

#### **Performance Budget Configuration**

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/create-goal"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.8 }]
      }
    }
  }
}
```

### Bundle Analysis

#### **Webpack Bundle Analyzer**

```bash
# Generate bundle analysis
npm run analyze:bundle

# Monitor bundle size trends
npm install -g bundlesize
```

```json
// package.json bundle size monitoring
{
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "300 kB"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50 kB"
    }
  ]
}
```

## User Analytics and Tracking

### Google Analytics 4 Setup

#### **Event Tracking Implementation**

```typescript
// Analytics utility
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

class Analytics {
  private isEnabled = false;

  init() {
    if (typeof gtag !== "undefined") {
      this.isEnabled = true;
      console.log("Analytics initialized");
    }
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    });
  }

  trackPageView(path: string) {
    if (!this.isEnabled) return;

    gtag("config", "GA_MEASUREMENT_ID", {
      page_path: path,
    });
  }

  trackUser(userId: string) {
    if (!this.isEnabled) return;

    gtag("config", "GA_MEASUREMENT_ID", {
      user_id: userId,
    });
  }
}

export const analytics = new Analytics();
```

#### **Key Events Tracked**

```typescript
// Goal-related events
analytics.trackEvent({
  action: "goal_created",
  category: "engagement",
  label: goalData.category,
  value: 1,
  custom_parameters: {
    goal_type: goalData.type,
    has_deadline: !!goalData.deadline,
  },
});

analytics.trackEvent({
  action: "goal_completed",
  category: "engagement",
  label: goalData.category,
  custom_parameters: {
    completion_time: completionTimeInDays,
  },
});

// User engagement events
analytics.trackEvent({
  action: "check_in_created",
  category: "engagement",
  label: "daily_progress",
  value: 1,
});

analytics.trackEvent({
  action: "goal_shared",
  category: "social",
  label: shareMethod, // linkedin, twitter, etc.
});

// Performance events
analytics.trackEvent({
  action: "page_load_time",
  category: "performance",
  label: pageName,
  value: loadTimeMs,
});
```

### Custom Event Tracking

#### **User Journey Tracking**

```typescript
// Track user flow completion
class UserJourneyTracker {
  private journeySteps: string[] = [];
  private startTime = Date.now();

  startJourney(journeyName: string) {
    this.journeySteps = [journeyName];
    this.startTime = Date.now();
  }

  addStep(stepName: string) {
    this.journeySteps.push(stepName);
  }

  completeJourney(success = true) {
    const duration = Date.now() - this.startTime;

    analytics.trackEvent({
      action: "journey_completed",
      category: "user_flow",
      label: this.journeySteps.join(" -> "),
      value: duration,
      custom_parameters: {
        success,
        steps_count: this.journeySteps.length,
        journey_duration: duration,
      },
    });
  }
}

// Usage
const tracker = new UserJourneyTracker();
tracker.startJourney("goal_creation");
tracker.addStep("category_selected");
tracker.addStep("form_filled");
tracker.addStep("goal_saved");
tracker.completeJourney(true);
```

## Infrastructure Monitoring

### Firebase Console Monitoring

#### **Key Dashboards**

**Hosting Metrics**

- Page views and unique visitors
- Bandwidth usage and geographic distribution
- Error rates (4xx, 5xx responses)
- Cache hit ratios

**Functions Metrics**

- Invocation count and success rate
- Execution time percentiles
- Memory usage patterns
- Cold start frequency

**Firestore Metrics**

- Read/write operation counts
- Query performance
- Storage usage
- Security rule evaluations

#### **Custom Monitoring Dashboards**

```typescript
// Health check endpoint
export const healthCheck = onRequest(async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.FUNCTION_VERSION || "1.0.0",
    services: {},
  };

  // Check Firestore
  try {
    const db = admin.firestore();
    await db.doc("health/check").get();
    health.services.firestore = { status: "connected" };
  } catch (error) {
    health.services.firestore = { status: "error", error: error.message };
    health.status = "degraded";
  }

  // Check Authentication
  try {
    await admin.auth().listUsers(1);
    health.services.auth = { status: "connected" };
  } catch (error) {
    health.services.auth = { status: "error", error: error.message };
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Google Cloud Monitoring

#### **Custom Alerts**

```yaml
# Alert policy examples
Error Rate Alert:
  condition: error_rate > 5% for 5 minutes
  notification: Slack + Email
  severity: High

Response Time Alert:
  condition: 95th_percentile > 2 seconds for 10 minutes
  notification: Slack
  severity: Medium

Memory Usage Alert:
  condition: memory_usage > 80% for 15 minutes
  notification: Email
  severity: Medium
```

## Error Tracking and Debugging

### Error Collection and Analysis

#### **Frontend Error Tracking**

```typescript
// Global error handler
window.addEventListener("error", (event) => {
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Send to logging service
  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(errorInfo),
  });
});

// Promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  const errorInfo = {
    message: "Unhandled Promise Rejection",
    reason: event.reason?.toString(),
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(errorInfo),
  });
});
```

#### **Backend Error Tracking**

```typescript
// Error monitoring middleware
export const errorHandler = (error: Error, context: any) => {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    severity: determineSeverity(error),
  };

  // Log to Cloud Logging
  logger.error("Application Error", errorReport);

  // Store in Firestore for analysis
  if (errorReport.severity === "high" || errorReport.severity === "critical") {
    admin.firestore().collection("errors").add(errorReport);
  }
};

function determineSeverity(error: Error): string {
  if (error.message.includes("PERMISSION_DENIED")) return "critical";
  if (error.message.includes("UNAUTHENTICATED")) return "high";
  if (error.message.includes("NOT_FOUND")) return "medium";
  return "low";
}
```

## Business Metrics

### Key Performance Indicators (KPIs)

#### **User Engagement Metrics**

| Metric                    | Target   | Tool               |
| ------------------------- | -------- | ------------------ |
| Daily Active Users        | > 100    | Firebase Analytics |
| Weekly Goal Creation Rate | > 70%    | Custom Analytics   |
| Goal Completion Rate      | > 60%    | Custom Analytics   |
| User Retention (7-day)    | > 50%    | Firebase Analytics |
| Session Duration          | > 10min  | Google Analytics   |
| Check-in Frequency        | > 3/week | Custom Analytics   |

#### **Platform Health Metrics**

```typescript
// Daily metrics collection
export const collectDailyMetrics = onSchedule("0 0 * * *", async () => {
  const metrics = {
    date: new Date().toISOString().split("T")[0],
    users: {
      total: await getUserCount(),
      active_today: await getActiveUserCount(1),
      active_week: await getActiveUserCount(7),
      new_signups: await getNewSignupCount(1),
    },
    goals: {
      total: await getTotalGoalCount(),
      created_today: await getGoalsCreatedCount(1),
      completed_today: await getGoalsCompletedCount(1),
    },
    engagement: {
      checkins_today: await getCheckinCount(1),
      shares_today: await getShareCount(1),
    },
    performance: {
      avg_page_load: await getAveragePageLoad(),
      error_rate: await getErrorRate(),
    },
  };

  await admin.firestore().collection("daily_metrics").add(metrics);
});
```

### Reporting and Dashboards

#### **Weekly Performance Report**

```typescript
// Generate weekly reports
export const generateWeeklyReport = onSchedule("0 9 * * 1", async () => {
  const report = await generatePerformanceReport("week");

  // Send to stakeholders
  await sendEmailReport(report, ["product@linkedgoals.app"]);

  // Store for historical analysis
  await admin.firestore().collection("weekly_reports").add(report);
});
```

---

This monitoring and observability setup provides comprehensive coverage of all aspects of the LinkedGoals MVP application, ensuring reliable operation and data-driven decision making. Regular review and updates of monitoring configurations should be part of the development process.
