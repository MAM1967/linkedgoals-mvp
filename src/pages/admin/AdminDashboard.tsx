import React, { useEffect, useState } from "react";
import {
  getTotalUsers,
  getNewUsersLast24Hours,
  getTotalGoals,
} from "../../lib/firebase";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const users = await getTotalUsers();
        setTotalUsers(users);

        const newUsersLast24h = await getNewUsersLast24Hours();
        setNewUsers(newUsersLast24h);

        const goals = await getTotalGoals();
        setTotalGoals(goals);
      } catch (error) {
        console.error("Error fetching admin metrics:", error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="metrics-grid">
        <div className="metric-card">
          <h2>Total Users</h2>
          <p>{totalUsers}</p>
        </div>
        <div className="metric-card">
          <h2>New Users (24h)</h2>
          <p>{newUsers}</p>
        </div>
        <div className="metric-card">
          <h2>Active Users</h2>
          <p>N/A</p>
        </div>
        <div className="metric-card">
          <h2>Total Goals</h2>
          <p>{totalGoals}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
