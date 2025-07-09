import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getFunctions, httpsCallable } from "firebase/functions";
import "./EmailAnalyticsDashboard.css";

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: {
    [key: string]: {
      total: number;
      sent: number;
      failed: number;
      pending: number;
    };
  };
}

interface TimeRangeOption {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRangeOption[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
];

const EmailAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(30);

  useEffect(() => {
    if (user) {
      fetchEmailStats();
    }
  }, [user, selectedTimeRange]);

  const fetchEmailStats = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Use Firebase Functions callable
      const functions = getFunctions();
      const getEmailStatsFunction = httpsCallable(functions, "getEmailStats");

      const result = await getEmailStatsFunction({ days: selectedTimeRange });
      const data = result.data as {
        success: boolean;
        stats?: EmailStats;
        error?: string;
      };

      if (data.success) {
        setStats(data.stats || null);
      } else {
        throw new Error(data.error || "Failed to fetch email statistics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = (sent: number, total: number): number => {
    return total > 0 ? Math.round((sent / total) * 100) : 0;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "sent":
        return "#22c55e"; // green
      case "failed":
        return "#ef4444"; // red
      case "pending":
        return "#f59e0b"; // yellow
      default:
        return "#6b7280"; // gray
    }
  };

  if (loading) {
    return (
      <div className="email-analytics-container">
        <div className="analytics-header">
          <h2>Email Analytics</h2>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading email statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-analytics-container">
        <div className="analytics-header">
          <h2>Email Analytics</h2>
        </div>
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button onClick={fetchEmailStats} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="email-analytics-container">
        <div className="analytics-header">
          <h2>Email Analytics</h2>
        </div>
        <div className="no-data-state">
          <p>No email statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-analytics-container">
      <div className="analytics-header">
        <h2>Email Analytics</h2>
        <div className="time-range-selector">
          <label htmlFor="timeRange">Time Range:</label>
          <select
            id="timeRange"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
            className="time-range-select"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.days} value={range.days}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>Total Emails</h3>
            <p className="stat-number">{stats.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Successfully Sent</h3>
            <p className="stat-number">{stats.sent.toLocaleString()}</p>
            <p className="stat-percentage">
              {calculateSuccessRate(stats.sent, stats.total)}% success rate
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Failed</h3>
            <p className="stat-number">{stats.failed.toLocaleString()}</p>
            <p className="stat-percentage">
              {calculateSuccessRate(stats.failed, stats.total)}% failure rate
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Email Types Breakdown */}
      <div className="email-types-section">
        <h3>Email Types Breakdown</h3>
        <div className="email-types-grid">
          {Object.entries(stats.byType).map(([type, typeStats]) => (
            <div key={type} className="email-type-card">
              <div className="email-type-header">
                <h4>{type.replace(/_/g, " ").toUpperCase()}</h4>
                <span className="email-type-total">{typeStats.total}</span>
              </div>

              <div className="email-type-stats">
                <div className="email-type-stat">
                  <span
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor("sent") }}
                  ></span>
                  <span>Sent: {typeStats.sent}</span>
                </div>

                <div className="email-type-stat">
                  <span
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor("failed") }}
                  ></span>
                  <span>Failed: {typeStats.failed}</span>
                </div>

                <div className="email-type-stat">
                  <span
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor("pending") }}
                  ></span>
                  <span>Pending: {typeStats.pending}</span>
                </div>
              </div>

              <div className="email-type-success-rate">
                Success Rate:{" "}
                {calculateSuccessRate(typeStats.sent, typeStats.total)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <h3>Performance Summary</h3>
        <div className="performance-grid">
          <div className="performance-metric">
            <h4>Overall Health</h4>
            <div
              className={`health-indicator ${
                calculateSuccessRate(stats.sent, stats.total) >= 95
                  ? "excellent"
                  : calculateSuccessRate(stats.sent, stats.total) >= 90
                  ? "good"
                  : calculateSuccessRate(stats.sent, stats.total) >= 80
                  ? "fair"
                  : "poor"
              }`}
            >
              {calculateSuccessRate(stats.sent, stats.total) >= 95
                ? "🟢 Excellent"
                : calculateSuccessRate(stats.sent, stats.total) >= 90
                ? "🟡 Good"
                : calculateSuccessRate(stats.sent, stats.total) >= 80
                ? "🟠 Fair"
                : "🔴 Needs Attention"}
            </div>
          </div>

          <div className="performance-metric">
            <h4>Most Active Email Type</h4>
            <p>
              {Object.entries(stats.byType)
                .reduce((a, b) =>
                  stats.byType[a[0]].total > stats.byType[b[0]].total ? a : b
                )[0]
                .replace(/_/g, " ")
                .toUpperCase()}
            </p>
          </div>

          <div className="performance-metric">
            <h4>Action Items</h4>
            {stats.failed > 0 ? (
              <p>⚠️ {stats.failed} failed emails need attention</p>
            ) : stats.pending > 5 ? (
              <p>⏳ {stats.pending} emails pending (check queue)</p>
            ) : (
              <p>✅ All systems operating normally</p>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="analytics-actions">
        <button onClick={fetchEmailStats} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default EmailAnalyticsDashboard;
