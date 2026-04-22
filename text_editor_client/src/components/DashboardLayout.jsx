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
import { APP_ROUTES } from "../constants/routes";
import { sessionService } from "../services/sessionService";
import { userService } from "../services/userService";

const navigationItems = [
  { label: "Dashboard", path: APP_ROUTES.dashboard, icon: LayoutGrid },
  { label: "Documents", path: APP_ROUTES.documents, icon: FileText },
  { label: "Projects", path: APP_ROUTES.projects, icon: FolderKanban },
];

const DashboardLayout = ({ title, subtitle, children, actions = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = sessionService.getCurrentUser();
  const userName = currentUser?.name || "Workspace user";
  const userRole = currentUser?.email || "Product owner workspace";

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
                onClick={() => navigate(APP_ROUTES.documents)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                <Plus size={16} />
                Tao document
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mt-5">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default DashboardLayout;
