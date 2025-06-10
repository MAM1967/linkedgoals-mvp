import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <h2>Admin Menu</h2>
        <ul>
          <li>
            <NavLink to="/admin" end>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users">Users</NavLink>
          </li>
        </ul>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
