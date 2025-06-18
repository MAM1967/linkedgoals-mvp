/* eslint-disable @typescript-eslint/no-explicit-any */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { EmailService } from "./emailService";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// Weekly email data interfaces
interface WeeklyProgressSummary {
  userId: string;
  userName: string;
  email: string;
  goalsCompleted: number;
  goalsInProgress: number;
  totalGoals: number;
  weeklyProgress: number;
  upcomingDeadlines: UpcomingDeadline[];
  recentAchievements: Achievement[];
  motivationalQuote: string;
  insights: WeeklyInsight[];
  streakCount: number;
}

interface UpcomingDeadline {
  goalId: string;
  goalTitle: string;
  dueDate: Date;
  daysRemaining: number;
  category: string;
}

interface Achievement {
  type: "goal_completed" | "milestone_reached" | "streak_achieved";
  title: string;
  description: string;
  achievedAt: Date;
  goalId?: string;
}

interface WeeklyInsight {
  type: "progress" | "streak" | "category" | "motivation";
  title: string;
  message: string;
  actionRequired?: boolean;
}

interface Goal {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: { seconds: number };
  category?: string;
  timebound?: { targetDate: string };
}

class WeeklyEmailContentGenerator {
  private static motivationalQuotes = [
    "Success is the sum of small efforts repeated day in and day out.",
    "The way to get started is to quit talking and begin doing.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is during our darkest moments that we must focus to see the light.",
    "Believe you can and you're halfway there.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only way to do great work is to love what you do.",
  ];

  static async generateWeeklyProgressSummary(
    userId: string
  ): Promise<WeeklyProgressSummary | null> {
    try {
      const db = getFirestore();

      // Get user data
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data()!;
      const userName =
        userData.displayName || userData.fullName || "Goal Achiever";
      const email = userData.email;

      // Get user's goals
      const goalsSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("smartGoals")
        .get();

      const goals: Goal[] = goalsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Goal
      );

      // Calculate goal statistics
      const totalGoals = goals.length;
      const goalsCompleted = goals.filter((goal) => goal.completed).length;
      const goalsInProgress = totalGoals - goalsCompleted;

      // Calculate weekly progress
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentlyCompleted = goals.filter(
        (goal) =>
          goal.completed &&
          goal.completedAt &&
          new Date(goal.completedAt.seconds * 1000) > weekAgo
      ).length;

      const weeklyProgress =
        totalGoals > 0 ? (recentlyCompleted / totalGoals) * 100 : 0;

      // Get upcoming deadlines
      const upcomingDeadlines = this.getUpcomingDeadlines(goals);

      // Get recent achievements
      const recentAchievements = this.getRecentAchievements(goals);

      // Generate insights
      const insights = this.generateInsights(
        goals,
        recentlyCompleted,
        weeklyProgress
      );

      // Calculate streak (simplified)
      const streakCount = userData.currentStreak || 0;

      // Get random motivational quote
      const motivationalQuote =
        this.motivationalQuotes[
          Math.floor(Math.random() * this.motivationalQuotes.length)
        ];

      return {
        userId,
        userName,
        email,
        goalsCompleted,
        goalsInProgress,
        totalGoals,
        weeklyProgress,
        upcomingDeadlines,
        recentAchievements,
        motivationalQuote,
        insights,
        streakCount,
      };
    } catch (error) {
      logger.error("Error generating weekly progress summary:", error);
      return null;
    }
  }

  private static getUpcomingDeadlines(goals: Goal[]): UpcomingDeadline[] {
    const now = new Date();

    return goals
      .filter((goal) => !goal.completed && goal.timebound?.targetDate)
      .map((goal) => {
        const dueDate = new Date(goal.timebound!.targetDate);
        const daysRemaining = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          goalId: goal.id,
          goalTitle: goal.description || "Untitled Goal",
          dueDate,
          daysRemaining,
          category: goal.category || "General",
        };
      })
      .filter(
        (deadline) => deadline.daysRemaining > 0 && deadline.daysRemaining <= 14
      )
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5); // Top 5 upcoming deadlines
  }

  private static getRecentAchievements(goals: Goal[]): Achievement[] {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const achievements: Achievement[] = [];

    // Check for completed goals
    goals.forEach((goal) => {
      if (goal.completed && goal.completedAt) {
        const completedDate = new Date(goal.completedAt.seconds * 1000);
        if (completedDate > weekAgo) {
          achievements.push({
            type: "goal_completed",
            title: "Goal Completed! 🎉",
            description: `You successfully completed "${goal.description}"`,
            achievedAt: completedDate,
            goalId: goal.id,
          });
        }
      }
    });

    return achievements.slice(0, 3); // Top 3 recent achievements
  }

  private static generateInsights(
    goals: Goal[],
    recentlyCompleted: number,
    weeklyProgress: number
  ): WeeklyInsight[] {
    const insights: WeeklyInsight[] = [];

    // Progress insight
    if (weeklyProgress > 0) {
      insights.push({
        type: "progress",
        title: "Great Progress!",
        message: `You completed ${recentlyCompleted} goal${recentlyCompleted !== 1 ? "s" : ""} this week. Keep up the momentum!`,
      });
    } else if (goals.length > 0) {
      insights.push({
        type: "motivation",
        title: "Time to Take Action",
        message:
          "No goals completed this week. Consider breaking down your goals into smaller, actionable steps.",
        actionRequired: true,
      });
    }

    // Category analysis
    const categoryCount: { [key: string]: number } = {};
    goals.forEach((goal) => {
      const category = goal.category || "General";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const mostCommonCategory = Object.entries(categoryCount).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (mostCommonCategory) {
      insights.push({
        type: "category",
        title: "Focus Area",
        message: `Most of your goals (${mostCommonCategory[1]}) are in ${mostCommonCategory[0]}. Consider diversifying your goal portfolio.`,
      });
    }

    return insights;
  }

  static generateEmailSubject(summary: WeeklyProgressSummary): string {
    const { userName, goalsCompleted, weeklyProgress } = summary;

    if (goalsCompleted > 0) {
      return `🎉 ${userName}, you completed ${goalsCompleted} goal${goalsCompleted !== 1 ? "s" : ""} this week!`;
    }

    if (weeklyProgress > 50) {
      return `📈 ${userName}, you're making great progress on your goals!`;
    }

    if (summary.upcomingDeadlines.length > 0) {
      return `⏰ ${userName}, you have upcoming goal deadlines this week`;
    }

    return `🎯 ${userName}, here's your weekly goal progress update`;
  }
}

// Scheduled function to send weekly emails (runs every Monday at 9 AM)
export const sendWeeklyEmails = onSchedule(
  {
    schedule: "0 9 * * 1", // 9 AM every Monday
    timeZone: "America/New_York",
    secrets: [RESEND_API_KEY],
  },
  async () => {
    logger.info("🚀 Starting weekly email send process");

    try {
      // Initialize EmailService
      EmailService.initialize(RESEND_API_KEY.value());

      const db = getFirestore();

      // Get all users who have opted in for weekly emails
      const usersSnapshot = await db
        .collection("users")
        .where("emailPreferences.weeklyUpdates", "==", true)
        .where("emailVerified", "==", true)
        .get();

      logger.info(
        `📧 Found ${usersSnapshot.size} users to send weekly emails to`
      );

      let successCount = 0;
      let errorCount = 0;

      // Process users in batches to avoid timeouts
      const batchSize = 10;
      const users = usersSnapshot.docs;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);

        const promises = batch.map(async (userDoc) => {
          try {
            const userId = userDoc.id;

            // Generate weekly progress summary
            const summary =
              await WeeklyEmailContentGenerator.generateWeeklyProgressSummary(
                userId
              );

            if (!summary) {
              logger.warn(`❌ Could not generate summary for user ${userId}`);
              return false;
            }

            // Send weekly update email
            const result = await EmailService.sendWeeklyUpdate(summary.email, {
              firstName: summary.userName,
              goalsCompleted: summary.goalsCompleted,
              goalsInProgress: summary.goalsInProgress,
              upcomingDeadlines: summary.upcomingDeadlines.map((d) => ({
                title: d.goalTitle,
                daysRemaining: d.daysRemaining,
                category: d.category,
              })),
              motivationalQuote: summary.motivationalQuote,
              dashboardUrl: "https://app.linkedgoals.app/dashboard",
              unsubscribeUrl: `https://app.linkedgoals.app/unsubscribe?userId=${userId}`,
              weeklyProgress: Math.round(summary.weeklyProgress),
              recentAchievements: summary.recentAchievements,
              insights: summary.insights,
              streakCount: summary.streakCount,
            });

            if (result.success) {
              logger.info(`✅ Weekly email sent to ${summary.email}`);
              return true;
            } else {
              logger.error(
                `❌ Failed to send weekly email to ${summary.email}: ${result.error}`
              );
              return false;
            }
          } catch (error) {
            logger.error(`❌ Error processing user ${userDoc.id}:`, error);
            return false;
          }
        });

        const results = await Promise.all(promises);
        successCount += results.filter((r) => r === true).length;
        errorCount += results.filter((r) => r === false).length;

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logger.info(
        `📊 Weekly email send complete: ${successCount} sent, ${errorCount} failed`
      );

      // Log statistics
      await db.collection("emailStats").add({
        type: "weekly_batch",
        date: new Date(),
        totalUsers: users.length,
        successCount,
        errorCount,
        successRate: users.length > 0 ? (successCount / users.length) * 100 : 0,
      });
    } catch (error) {
      logger.error("❌ Error in weekly email send process:", error);
      throw error;
    }
  }
);
