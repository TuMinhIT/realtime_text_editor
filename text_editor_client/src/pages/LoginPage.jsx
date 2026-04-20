import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  PencilLine,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { userService } from "../services/userService";

const highlights = [
  "Word-style editor workspace",
  "Mock upload va document dashboard",
  "San sang mo rong realtime collaboration",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const persistCurrentUser = (response, fallbackName, fallbackEmail) => {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: response.user?.id || response.userId || fallbackEmail,
        name: response.user?.fullName || fallbackName,
        email: response.user?.email || fallbackEmail,
      }),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await userService.login(formData.email, formData.password);
        persistCurrentUser(response, formData.email.split("@")[0], formData.email);
        navigate("/dashboard");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const response = await userService.register(
        formData.name,
        formData.email,
        formData.password,
      );
      persistCurrentUser(response, formData.name, formData.email);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(180deg,#fffdf8_0%,#eef2ff_100%)] px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_45px_120px_-55px_rgba(15,23,42,0.8)] md:p-10">
          <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
                <Sparkles size={14} />
                Collaborative editor
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Dang nhap vao workspace viet va review tai lieu.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                  Giao dien moi theo style editorial: dep, sach va hop voi flow
                  dashboard, documents, editor ma ban dang xay.
                </p>
              </div>

              <div className="grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <CheckCircle2 size={18} className="text-emerald-300" />
                    <p className="text-sm text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Security
                </p>
                <p className="mt-2 text-lg font-semibold">Safe access</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Dashboard
                </p>
                <p className="mt-2 text-lg font-semibold">Unified layout</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Editor
                </p>
                <p className="mt-2 text-lg font-semibold">Word-style UI</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
          <div className="mx-auto flex h-full max-w-xl flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Welcome</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                    {isLogin ? "Dang nhap tai khoan" : "Tao tai khoan moi"}
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <LogIn size={24} />
                </div>
              </div>

              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isLogin
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    !isLogin
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition focus-within:border-slate-400 focus-within:bg-white">
                    <User size={18} className="text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Nguyen Van A"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      required={!isLogin}
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition focus-within:border-slate-400 focus-within:bg-white">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="ban@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition focus-within:border-slate-400 focus-within:bg-white">
                  <Lock size={18} className="text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Nhap mat khau"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Confirm password
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition focus-within:border-slate-400 focus-within:bg-white">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Nhap lai mat khau"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      required={!isLogin}
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Dang xu ly...
                  </>
                ) : (
                  <>
                    {isLogin ? "Vao dashboard" : "Tao tai khoan"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Muon xem nhanh giao dien he thong?
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Ban co the dang nhap hoac tao tai khoan de vao dashboard va tiep tuc flow upload, documents, editor.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <PencilLine size={20} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
