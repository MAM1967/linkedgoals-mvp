import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import SafeEmailVerificationBanner from "./SafeEmailVerificationBanner";
import "./EmailPreferences.css";

interface EmailPreferencesData {
  weeklyUpdates: boolean;
  announcements: boolean;
  goalReminders: boolean;
  coachingNotes: boolean;
  marketingEmails: boolean;
  frequency: "weekly" | "biweekly" | "monthly";
  unsubscribeAll: boolean;
}

const defaultPreferences: EmailPreferencesData = {
  weeklyUpdates: true,
  announcements: true,
  goalReminders: true,
  coachingNotes: true,
  marketingEmails: false,
  frequency: "weekly",
  unsubscribeAll: false,
};

const EmailPreferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<EmailPreferencesData>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const emailPrefs = userData.emailPreferences || defaultPreferences;
          setPreferences({ ...defaultPreferences, ...emailPrefs });
        }
      } catch (error) {
        console.error("Error fetching email preferences:", error);
        setMessage("❌ Failed to load preferences. Using defaults.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const handlePreferenceChange = (
    key: keyof EmailPreferencesData,
    value: boolean | string
  ) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };

      // If unsubscribing from all, disable all other options
      if (key === "unsubscribeAll" && value === true) {
        updated.weeklyUpdates = false;
        updated.announcements = false;
        updated.goalReminders = false;
        updated.coachingNotes = false;
        updated.marketingEmails = false;
      }

      // If enabling any option, disable unsubscribe all
      if (key !== "unsubscribeAll" && value === true) {
        updated.unsubscribeAll = false;
      }

      return updated;
    });
    setHasChanges(true);
    setMessage("");
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        emailPreferences: preferences,
        lastUpdated: new Date(),
      });

      setMessage("✅ Email preferences saved successfully!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving email preferences:", error);
      setMessage("❌ Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    setMessage("");
  };

  if (!user) {
    return (
      <div className="email-preferences-container">
        <div className="email-preferences-card">
          <h2>Email Preferences</h2>
          <p>Please log in to manage your email preferences.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="email-preferences-container">
        <div className="email-preferences-card">
          <h2>Email Preferences</h2>
          <p>Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-preferences-container">
      {/* Email Verification Banner */}
      <SafeEmailVerificationBanner />

      <div className="email-preferences-card">
        <div className="preferences-header">
          <h2>Email Preferences</h2>
          <p className="preferences-description">
            Control what emails you receive from LinkedGoals. You can change
            these settings anytime.
          </p>
        </div>

        {message && (
          <div
            className={`message ${
              message.includes("✅") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        <div className="preferences-sections">
          {/* Goal-Related Emails */}
          <div className="preference-section">
            <h3 className="section-title">Goal Updates</h3>
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">
                  Weekly Progress Updates
                </label>
                <p className="preference-description">
                  Get a summary of your goal progress, achievements, and
                  insights every week.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.weeklyUpdates}
                  onChange={(e) =>
                    handlePreferenceChange("weeklyUpdates", e.target.checked)
                  }
                  disabled={preferences.unsubscribeAll}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Goal Reminders</label>
                <p className="preference-description">
                  Receive reminders about upcoming deadlines and goals that need
                  attention.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.goalReminders}
                  onChange={(e) =>
                    handlePreferenceChange("goalReminders", e.target.checked)
                  }
                  disabled={preferences.unsubscribeAll}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Coaching Notes</label>
                <p className="preference-description">
                  Get notified when you receive new coaching feedback on your
                  goals.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.coachingNotes}
                  onChange={(e) =>
                    handlePreferenceChange("coachingNotes", e.target.checked)
                  }
                  disabled={preferences.unsubscribeAll}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Platform Communications */}
          <div className="preference-section">
            <h3 className="section-title">Platform Communications</h3>
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Announcements</label>
                <p className="preference-description">
                  Important updates about new features, maintenance, and
                  platform news.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.announcements}
                  onChange={(e) =>
                    handlePreferenceChange("announcements", e.target.checked)
                  }
                  disabled={preferences.unsubscribeAll}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Marketing Emails</label>
                <p className="preference-description">
                  Tips, success stories, and promotional content to help you
                  achieve more.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.marketingEmails}
                  onChange={(e) =>
                    handlePreferenceChange("marketingEmails", e.target.checked)
                  }
                  disabled={preferences.unsubscribeAll}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Frequency Settings */}
          <div className="preference-section">
            <h3 className="section-title">Email Frequency</h3>
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">Update Frequency</label>
                <p className="preference-description">
                  How often would you like to receive progress updates?
                </p>
              </div>
              <select
                className="frequency-select"
                value={preferences.frequency}
                onChange={(e) =>
                  handlePreferenceChange("frequency", e.target.value)
                }
                disabled={preferences.unsubscribeAll}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Unsubscribe All */}
          <div className="preference-section danger-section">
            <h3 className="section-title">Unsubscribe</h3>
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">
                  Unsubscribe from all emails
                </label>
                <p className="preference-description">
                  Turn off all non-essential emails. You'll still receive
                  critical account notifications.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={preferences.unsubscribeAll}
                  onChange={(e) =>
                    handlePreferenceChange("unsubscribeAll", e.target.checked)
                  }
                />
                <span className="slider danger"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="preferences-actions">
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={saving}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || !hasChanges}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div className="verification-status">
          <h3>Email Verification Status</h3>
          <div className="verification-info">
            {user.customEmailVerified ? (
              <span className="verified">✅ Your email is verified</span>
            ) : (
              <span className="unverified">
                ⚠️ Email not verified - some features may be limited
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
