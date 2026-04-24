import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  BarChart2,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "viewer"],
  },
  {
    to: "/products",
    label: "Products",
    icon: Package,
    roles: ["owner", "manager", "viewer"],
  },
  {
    to: "/categories",
    label: "Categories",
    icon: Tag,
    roles: ["owner", "manager"],
  },
  { to: "/pos", label: "POS", icon: ShoppingCart, roles: ["owner", "manager"] },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart2,
    roles: ["owner", "manager", "viewer"],
  },
  { to: "/users", label: "Users", icon: Users, roles: ["owner"] },
];

export default function Layout() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-green-700 text-white flex flex-col transform transition-all duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Header */}
        <div
          className={`border-b border-green-600 flex items-center ${collapsed ? "p-3 justify-center" : "p-6 justify-between"}`}
        >
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">Store Manager</h1>
              <p className="text-green-200 text-sm mt-1 truncate">
                {appUser?.email}
              </p>
              <span className="inline-block mt-1 text-xs bg-green-500 px-2 py-0.5 rounded capitalize">
                {appUser?.role}
              </span>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-green-600/60 transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-2" : "px-4"}`}>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : "px-4"} ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-green-100 hover:bg-green-600/50"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out */}
        <div
          className={`p-2 border-t border-green-600 ${collapsed ? "px-2" : "px-4 pb-4 pt-2"}`}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-green-100 hover:bg-green-600/50 transition-colors ${collapsed ? "justify-center px-2" : "px-4"}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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
