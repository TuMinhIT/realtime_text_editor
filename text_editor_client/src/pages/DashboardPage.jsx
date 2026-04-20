import React from "react";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  FileCheck2,
  Files,
  MessageSquareMore,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

const stats = [
  { label: "Documents", value: "24", icon: Files, tone: "bg-sky-100 text-sky-700" },
  { label: "Active editors", value: "08", icon: Users, tone: "bg-emerald-100 text-emerald-700" },
  { label: "Pending review", value: "05", icon: FileCheck2, tone: "bg-amber-100 text-amber-700" },
  { label: "Comments", value: "19", icon: MessageSquareMore, tone: "bg-rose-100 text-rose-700" },
];

const recentActivities = [
  "Proposal Q2 vua duoc cap nhat boi Lan luc 09:24",
  "Team guideline da mock upload thanh cong",
  "Section pham vi dang cho review",
];

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      title="Tong quan dashboard"
      subtitle="Trang nay la layout dashboard de ban nhin nhanh tinh hinh workspace, dieu huong sang documents va mo rong cac module quan tri sau nay."
      actions={
        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Mo documents
        </button>
      }
    >
      <div className="grid gap-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon size={22} />
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Team progress</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                  Overview theo tuan
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <BarChart3 size={22} />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Upload</p>
                <p className="mt-3 text-3xl font-semibold">12</p>
                <p className="mt-2 text-sm text-slate-600">Tai lieu moi duoc dua vao workspace.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Editing</p>
                <p className="mt-3 text-3xl font-semibold">07</p>
                <p className="mt-2 text-sm text-slate-600">Document dang duoc mo trong editor.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Approved</p>
                <p className="mt-3 text-3xl font-semibold">04</p>
                <p className="mt-2 text-sm text-slate-600">Tai lieu da chot sau vong review.</p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <p className="text-sm font-medium text-slate-500">Recent activity</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">Hoat dong gan day</h3>

            <div className="mt-6 space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-700">{activity}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Schedule</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">Moc can chu y</h3>
              </div>
              <Clock3 size={20} className="text-slate-400" />
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-900">10:00 - Review scope</p>
                <p className="mt-1 text-sm text-slate-600">Kiem tra section 02 truoc khi ban giao.</p>
              </div>
              <div className="rounded-[24px] bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-900">14:00 - Sync editor flow</p>
                <p className="mt-1 text-sm text-slate-600">Thong nhat upload, autosave va versioning.</p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Shortcut</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                  Di chuyen nhanh
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-left transition hover:border-slate-400 hover:bg-white"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">Workspace documents</p>
                  <p className="mt-1 text-sm text-slate-600">Upload va mo document mock.</p>
                </div>
                <ArrowRight size={18} className="text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/editor?doc=demo-proposal")}
                className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-left transition hover:border-slate-400 hover:bg-white"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">Open editor</p>
                  <p className="mt-1 text-sm text-slate-600">Mo nhanh mot document mau.</p>
                </div>
                <ArrowRight size={18} className="text-slate-500" />
              </button>
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
