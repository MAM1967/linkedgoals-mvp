import React, { useState } from "react";
import {
  seedCoachingTestData,
  clearCoachingTestData,
} from "../utils/seedTestData";

interface SeededData {
  users: Array<{ id: string; name: string }>;
  goals: Array<{ userId: string; goalId: string; description: string }>;
}

const DataSeeder: React.FC = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [seededData, setSeededData] = useState<SeededData | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setStatus("Seeding test data...");

    try {
      const result = await seedCoachingTestData();
      setSeededData(result);
      setStatus("✅ Test data seeded successfully!");
    } catch (error) {
      setStatus(`❌ Error seeding data: ${error}`);
      console.error("Seeding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    setStatus("Clearing test data...");

    try {
      await clearCoachingTestData();
      setSeededData(null);
      setStatus("✅ Test data cleared!");
    } catch (error) {
      setStatus(`❌ Error clearing data: ${error}`);
      console.error("Clearing error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        border: "2px solid #e0e0e0",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ color: "#333", marginBottom: "20px" }}>
        🧪 Test Data Seeder for Coaching Onboarding
      </h2>

      <p style={{ marginBottom: "20px", color: "#666" }}>
        This tool creates test users and goals in the Firestore database so you
        can test the coaching onboarding page with real data.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleSeedData}
          disabled={loading}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Working..." : "🌱 Seed Test Data"}
        </button>

        <button
          onClick={handleClearData}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Working..." : "🧹 Clear Test Data"}
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: status.includes("❌") ? "#f8d7da" : "#d4edda",
            border: `1px solid ${
              status.includes("❌") ? "#f5c6cb" : "#c3e6cb"
            }`,
            borderRadius: "4px",
            color: status.includes("❌") ? "#721c24" : "#155724",
          }}
        >
          {status}
        </div>
      )}

      {seededData && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>
            📊 Seeded Data
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <h4 style={{ color: "#555" }}>Test Users Created:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              {seededData.users.map((user) => (
                <li key={user.id} style={{ marginBottom: "5px" }}>
                  <strong>{user.name}</strong> ({user.id})
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h4 style={{ color: "#555" }}>Test Goals Created:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              {seededData.goals.map((goal) => (
                <li key={goal.goalId} style={{ marginBottom: "5px" }}>
                  <strong>{goal.description}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
            }}
          >
            <h4 style={{ color: "#1976d2", marginBottom: "10px" }}>
              🔗 Test URLs
            </h4>
            <p
              style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}
            >
              Copy these URLs to test the coaching onboarding page:
            </p>

            <div style={{ marginBottom: "10px" }}>
              <strong>Sarah's MBA Goal:</strong>
              <br />
              <code
                style={{
                  fontSize: "12px",
                  padding: "5px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "3px",
                  display: "block",
                  marginTop: "5px",
                  wordBreak: "break-all",
                }}
              >
                http://localhost:5173/coach-onboarding?inviterId=test-user-sarah-johnson&goalId=test-goal-mba-degree&inviterName=Sarah%20Johnson
              </code>
            </div>

            <div>
              <strong>Mike's Marathon Goal:</strong>
              <br />
              <code
                style={{
                  fontSize: "12px",
                  padding: "5px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "3px",
                  display: "block",
                  marginTop: "5px",
                  wordBreak: "break-all",
                }}
              >
                http://localhost:5173/coach-onboarding?inviterId=test-user-mike-chen&goalId=test-goal-fitness&inviterName=Mike%20Chen
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSeeder;
