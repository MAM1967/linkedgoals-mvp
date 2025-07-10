import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface Goal {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: { seconds: number };
  category?: string;
  timebound?: { targetDate: string };
}

export interface WeeklyProgressSummary {
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

export interface UpcomingDeadline {
  goalId: string;
  goalTitle: string;
  dueDate: Date;
  daysRemaining: number;
  category: string;
}

export interface Achievement {
  type: "goal_completed" | "milestone_reached" | "streak_achieved";
  title: string;
  description: string;
  achievedAt: Date;
  goalId?: string;
}

export interface WeeklyInsight {
  type: "progress" | "streak" | "category" | "motivation";
  title: string;
  message: string;
  actionRequired?: boolean;
}

export class WeeklyEmailContentGenerator {
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
      // Get user data
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      const userName =
        userData.displayName || userData.fullName || "Goal Achiever";
      const email = userData.email;

      // Get user's goals
      const goalsRef = collection(db, "users", userId, "smartGoals");
      const goalsSnapshot = await getDocs(goalsRef);

      const goals: Goal[] = goalsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Goal)
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
      const recentAchievements = await this.getRecentAchievements(
        userId,
        goals
      );

      // Generate insights
      const insights = this.generateInsights(
        goals,
        recentlyCompleted,
        weeklyProgress
      );

      // Calculate streak (simplified)
      const streakCount = await this.calculateStreak(userId);

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
      console.error("Error generating weekly progress summary:", error);
      return null;
    }
  }

  private static getUpcomingDeadlines(goals: Goal[]): UpcomingDeadline[] {
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

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

  private static async getRecentAchievements(
    userId: string,
    goals: Goal[]
  ): Promise<Achievement[]> {
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

    // Could add more achievement types here (milestones, streaks, etc.)

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
        message: `You completed ${recentlyCompleted} goal${
          recentlyCompleted !== 1 ? "s" : ""
        } this week. Keep up the momentum!`,
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

  private static async calculateStreak(userId: string): Promise<number> {
    // Simplified streak calculation - in a real implementation,
    // this would track daily goal activities
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.currentStreak || 0;
      }
    } catch (error) {
      console.error("Error calculating streak:", error);
    }
    return 0;
  }

  static generateEmailSubject(summary: WeeklyProgressSummary): string {
    const { userName, goalsCompleted, weeklyProgress } = summary;

    if (goalsCompleted > 0) {
      return `🎉 ${userName}, you completed ${goalsCompleted} goal${
        goalsCompleted !== 1 ? "s" : ""
      } this week!`;
    }

    if (weeklyProgress > 50) {
      return `📈 ${userName}, you're making great progress on your goals!`;
    }

    if (summary.upcomingDeadlines.length > 0) {
      return `⏰ ${userName}, you have upcoming goal deadlines this week`;
    }

    return `🎯 ${userName}, here's your weekly goal progress update`;
  }

  static async getUsersForWeeklyEmail(): Promise<string[]> {
    try {
      // Get all users who have opted in for weekly emails
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("emailPreferences.weeklyUpdates", "==", true),
        where("emailVerified", "==", true)
      );

      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error("Error getting users for weekly email:", error);
      return [];
    }
  }
}
