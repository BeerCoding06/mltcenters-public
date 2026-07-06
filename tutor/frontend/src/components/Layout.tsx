import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-sky-400">
            ครูสอนภาษาอังกฤษ AI
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/tutor" className="hover:text-sky-300">
              ฝึกสนทนา
            </Link>
            <Link to="/dashboard" className="hover:text-sky-300">
              แดชบอร์ด
            </Link>
            {user ? (
              <>
                <span className="text-slate-400">{user.full_name}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1 hover:bg-slate-700"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-lg bg-sky-600 px-3 py-1 hover:bg-sky-500">
                เข้าสู่ระบบ
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
