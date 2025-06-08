import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
