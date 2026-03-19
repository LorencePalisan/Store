import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: ["owner", "manager", "viewer"],
  },
  { to: "/products", label: "Products", roles: ["owner", "manager", "viewer"] },
  { to: "/categories", label: "Categories", roles: ["owner", "manager"] },
  { to: "/pos", label: "POS", roles: ["owner", "manager"] },
  { to: "/reports", label: "Reports", roles: ["owner", "manager", "viewer"] },
  { to: "/users", label: "Users", roles: ["owner"] },
];

export default function Layout() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const filteredNav = navItems.filter(
    (item) => appUser && item.roles.includes(appUser.role),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-green-700 text-white transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-green-600">
          <h1 className="text-xl font-bold">Store Manager</h1>
          <p className="text-green-200 text-sm mt-1">{appUser?.email}</p>
          <span className="inline-block mt-1 text-xs bg-green-500 px-2 py-0.5 rounded capitalize">
            {appUser?.role}
          </span>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-green-100 hover:bg-green-600/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-green-100 hover:bg-green-600/50 transition-colors text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">
            Store Manager
          </h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
