import React from "react";
import {
  Bell,
  FileText,
  FolderKanban,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Projects", path: "/projects", icon: FolderKanban },
];

const DashboardLayout = ({
  title,
  subtitle,
  children,
  actions = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-5 p-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-6">
        <aside className="rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-[0_35px_120px_-55px_rgba(15,23,42,0.8)]">
          <div className="flex h-full flex-col">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
                Text Editor
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Khung dieu huong de quan ly workspace, documents va editor flow.
              </p>
            </div>

            <nav className="mt-8 space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Quick action
              </p>
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                <Plus size={16} />
                Tao document
              </button>
            </div>

            <div className="mt-auto space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">Minh Tran</p>
                <p className="mt-1 text-sm text-slate-400">
                  Product owner workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <LogOut size={16} />
                Login page
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Workspace</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search workspace"
                    className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400 sm:w-48"
                  />
                </label>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-slate-400"
                >
                  <Bell size={18} />
                </button>

                {actions}
              </div>
            </div>
          </header>

          <div className="mt-5">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default DashboardLayout;
