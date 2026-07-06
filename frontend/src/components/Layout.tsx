import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const nav = [
    { to: "/chat", label: "Chat" },
    { to: "/dashboard", label: "Dashboard" },
    ...(user?.is_admin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-brand-700">
            English Assessment
          </Link>
          <nav className="flex items-center gap-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium ${
                  location.pathname === item.to
                    ? "text-brand-600"
                    : "text-slate-600 hover:text-brand-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
