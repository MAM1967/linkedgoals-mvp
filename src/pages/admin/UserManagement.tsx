import React, { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getUsersWithFallback, getAllUsers } from "../../lib/firebase";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import "./UserManagement.css";

interface User {
  id: string;
  fullName: string;
  email: string;
  disabled?: boolean;
  createdAt: {
    toDate: () => Date;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const functions = getFunctions();
  const manageUser = httpsCallable(functions, "manageUser");
  const syncUsers = httpsCallable(functions, "syncUsersToFirestore");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { users: newUsers, last } = await getUsersWithFallback(lastVisible);
      setUsers((prevUsers) => [...prevUsers, ...newUsers] as User[]);
      setLastVisible(last);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users.");
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers as User[]);
      setLastVisible(null);
      setDebugMode(true);
    } catch (err) {
      console.error("Error fetching all users:", err);
      setError("Failed to fetch all users.");
    }
    setLoading(false);
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncUsers();
      const resultData = result.data as {
        message: string;
        stats: {
          processedCount: number;
          createdCount: number;
          updatedCount: number;
        };
      };
      alert(
        `✅ ${resultData.message}\n\nStats:\n- Processed: ${resultData.stats.processedCount}\n- Created: ${resultData.stats.createdCount}\n- Updated: ${resultData.stats.updatedCount}`
      );

      // Refresh the user list after sync
      setUsers([]);
      setLastVisible(null);
      setDebugMode(false);
      fetchUsers();
    } catch (err) {
      console.error("Error syncing users:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert(`❌ Failed to sync users: ${errorMessage}`);
    }
    setSyncing(false);
  };

  const handleManageUser = async (
    uid: string,
    action: "enable" | "disable" | "delete"
  ) => {
    if (
      action === "delete" &&
      !window.confirm(
        `Are you sure you want to permanently delete user ${uid}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await manageUser({ uid, action });

      if (action === "delete") {
        setUsers(users.filter((user) => user.id !== uid));
      } else {
        setUsers(
          users.map((user) =>
            user.id === uid ? { ...user, disabled: action === "disable" } : user
          )
        );
      }
      alert(`User successfully ${action}d.`);
    } catch (err: unknown) {
      console.error(`Error performing action: ${action}`, err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Failed to ${action} user: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="user-management">
      <h1>User Management</h1>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        🔄 Version: 2024-06-17-sync-enabled
      </p>
      {debugMode && (
        <p className="debug-info">
          Debug Mode: Showing all users without pagination
        </p>
      )}
      {error && <p className="error-message">{error}</p>}
      <div className="user-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Sign-up Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={user.disabled ? "disabled-user" : ""}
              >
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.disabled ? "Disabled" : "Active"}</td>
                <td>
                  {user.createdAt?.toDate()?.toLocaleDateString() || "N/A"}
                </td>
                <td className="actions-cell">
                  <button
                    className="action-button disable"
                    onClick={() =>
                      handleManageUser(
                        user.id,
                        user.disabled ? "enable" : "disable"
                      )
                    }
                  >
                    {user.disabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleManageUser(user.id, "delete")}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={fetchUsers}
        disabled={loading || !lastVisible || debugMode}
      >
        {loading ? "Loading..." : "Load More"}
      </button>
      <button onClick={fetchAllUsers} disabled={loading}>
        {loading ? "Loading..." : "Load All Users"}
      </button>
      <button onClick={handleSyncUsers} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Users"}
      </button>
    </div>
  );
};

export default UserManagement;
