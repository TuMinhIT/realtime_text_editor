import React from "react";
import { ArrowRight, FolderKanban, Layers3, TimerReset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

const projectCards = [
  {
    title: "Realtime editor client",
    description: "Khung giao dien upload, workspace va editor de mo rong collaboration.",
    status: "In progress",
  },
  {
    title: "Permission management",
    description: "Khu vuc de sau nay gan role, visibility va section ownership.",
    status: "Planned",
  },
  {
    title: "Review workflow",
    description: "Flow comment, approve va versioning cho document team.",
    status: "Research",
  },
];

const Projects = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      title="Projects"
      subtitle="Trang nay giu cho dashboard mot khu vuc du an gon gang, khong con phu thuoc vao file cu bi loi import."
      actions={
        <button
          type="button"
          onClick={() => navigate("/documents")}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Mo workspace
        </button>
      }
    >
      <div className="grid gap-5">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <FolderKanban size={22} />
            </div>
            <p className="mt-5 text-sm text-slate-500">Active projects</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">03</p>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Layers3 size={22} />
            </div>
            <p className="mt-5 text-sm text-slate-500">Modules</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">08</p>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <TimerReset size={22} />
            </div>
            <p className="mt-5 text-sm text-slate-500">Sprint window</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">12 days</p>
          </article>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-medium text-slate-500">Project list</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Cac huong dang trien khai
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <article
                key={project.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {project.status}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {project.description}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/documents")}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900"
                >
                  Xem workspace
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Projects;
