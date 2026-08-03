/**
 * The authenticated shell: sidebar + navbar + routed content.
 *
 * Rules:
 *   - Role restrictions live here, once per shell — never on individual routes.
 *   - A layout may read the current user and permissions. It MUST NOT load a
 *     domain entity.
 */
import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => (
  <div className="flex min-h-screen bg-bg-page">
    {/* <Sidebar /> — layout-only, lives in ./shared/ */}
    <div className="flex flex-1 flex-col">
      {/* <Navbar /> */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
