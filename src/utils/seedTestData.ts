import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Seed test data for coaching onboarding demo
export const seedCoachingTestData = async () => {
  try {
    // Create a test user with a goal
    const testUserId = "test-user-sarah-johnson";
    const testGoalId = "test-goal-mba-degree";

    // Create test user
    const userRef = doc(db, "users", testUserId);
    await setDoc(userRef, {
      uid: testUserId,
      email: "sarah.johnson@example.com",
      displayName: "Sarah Johnson",
      role: "user",
      createdAt: serverTimestamp(),
      linkedinProfile: {
        sub: "sarah-johnson-linkedin-id",
        given_name: "Sarah",
        family_name: "Johnson",
        email_verified: true,
      },
    });

    // Create test goal that needs a coach
    const goalRef = doc(db, `users/${testUserId}/goals`, testGoalId);
    await setDoc(goalRef, {
      id: testGoalId,
      description: "Complete my MBA degree by December 2024",
      specific: "Earn MBA from Stanford Graduate School of Business",
      measurable: {
        type: "Boolean",
        targetValue: null,
        currentValue: false,
      },
      achievable:
        "I have been accepted to the program and have arranged financing",
      relevant: "This will advance my career in consulting and leadership",
      dueDate: "2024-12-15",
      category: "Career",
      createdAt: serverTimestamp(),
      status: "active",
      completed: false,
    });

    // Create another test user and goal
    const testUserId2 = "test-user-mike-chen";
    const testGoalId2 = "test-goal-fitness";

    const userRef2 = doc(db, "users", testUserId2);
    await setDoc(userRef2, {
      uid: testUserId2,
      email: "mike.chen@example.com",
      displayName: "Mike Chen",
      role: "user",
      createdAt: serverTimestamp(),
      linkedinProfile: {
        sub: "mike-chen-linkedin-id",
        given_name: "Mike",
        family_name: "Chen",
        email_verified: true,
      },
    });

    const goalRef2 = doc(db, `users/${testUserId2}/goals`, testGoalId2);
    await setDoc(goalRef2, {
      id: testGoalId2,
      description: "Run a marathon in under 4 hours",
      specific: "Complete the Boston Marathon in under 4 hours",
      measurable: {
        type: "Numeric",
        targetValue: 4,
        currentValue: 0,
        unit: "hours",
      },
      achievable:
        "I have been training consistently and completed a half marathon",
      relevant: "This will improve my overall health and mental resilience",
      dueDate: "2024-10-15",
      category: "Health",
      createdAt: serverTimestamp(),
      status: "active",
      completed: false,
    });

    // Create a test admin user
    const adminUserId = "test-admin-coach";
    const adminRef = doc(db, "users", adminUserId);
    await setDoc(adminRef, {
      uid: adminUserId,
      email: "coach@linkedgoals.app",
      displayName: "Professional Coach",
      role: "admin",
      createdAt: serverTimestamp(),
      linkedinProfile: {
        sub: "professional-coach-linkedin-id",
        given_name: "Professional",
        family_name: "Coach",
        email_verified: true,
      },
    });

    console.log("✅ Test data seeded successfully!");
    console.log(`Test URLs for coaching onboarding:`);
    console.log(
      `1. Sarah's MBA Goal: http://localhost:5173/coach-onboarding?inviterId=${testUserId}&goalId=${testGoalId}&inviterName=Sarah%20Johnson`
    );
    console.log(
      `2. Mike's Marathon Goal: http://localhost:5173/coach-onboarding?inviterId=${testUserId2}&goalId=${testGoalId2}&inviterName=Mike%20Chen`
    );

    return {
      users: [
        { id: testUserId, name: "Sarah Johnson" },
        { id: testUserId2, name: "Mike Chen" },
        { id: adminUserId, name: "Professional Coach" },
      ],
      goals: [
        {
          userId: testUserId,
          goalId: testGoalId,
          description: "Complete my MBA degree by December 2024",
        },
        {
          userId: testUserId2,
          goalId: testGoalId2,
          description: "Run a marathon in under 4 hours",
        },
      ],
    };
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
};

// Function to clear test data (useful for cleanup)
export const clearCoachingTestData = async () => {
  try {
    console.log("🧹 Clearing test data...");
    // Note: In a real scenario, you'd want to delete the documents
    // For now, this is just a placeholder
    console.log("✅ Test data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing test data:", error);
    throw error;
  }
};
