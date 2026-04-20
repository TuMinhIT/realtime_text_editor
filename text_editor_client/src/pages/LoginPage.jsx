import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { APP_ROUTES } from "../constants/routes";
import { sessionService } from "../services/sessionService";
import { userService } from "../services/userService";

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const highlights = [
  "Chỉnh sửa tài liệu mượt mà",
  "Đồng bộ thời gian thực",
  "Hỗ trợ làm việc nhóm",
];

const inputClassName =
  "flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all focus-within:border-amber-400 focus-within:shadow-sm hover:border-slate-300";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const persistCurrentUser = (response, fallbackName, fallbackEmail) => {
    sessionService.setCurrentUser({
      id: response.user?.id || response.userId || fallbackEmail,
      name: response.user?.fullName || fallbackName,
      email: response.user?.email || fallbackEmail,
    });
  };

  const handleAuthModeChange = (mode) => {
    setIsLogin(mode === "login");
    setError("");
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await userService.login(formData.email, formData.password);
        persistCurrentUser(response, formData.email.split("@")[0], formData.email);
        navigate(APP_ROUTES.dashboard);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Mật khẩu xác nhận không khớp");
        setLoading(false);
        return;
      }

      const response = await userService.register(
        formData.name,
        formData.email,
        formData.password,
      );
      if (response.user) {
        persistCurrentUser(response, formData.name, formData.email);
      }
      navigate(response.token ? APP_ROUTES.dashboard : APP_ROUTES.login);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-indigo-50 px-4 py-8 md:py-12 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="grid min-h-[640px] overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_460px]">

          {/* Left Side - Hero */}
          <section className="relative hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(129,140,248,0.18),transparent_60%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-xs font-medium uppercase tracking-widest text-amber-200">
                <Sparkles size={16} />
                TXT EDITOR X
              </div>

              <h1 className="mt-10 text-5xl font-semibold leading-tight tracking-tighter">
                Viết và quản lý<br />tài liệu thông minh
              </h1>
              <p className="mt-6 max-w-md text-lg text-slate-300">
                Giao diện đơn giản. Đồng bộ nhanh. Làm việc nhóm dễ dàng.
              </p>
            </div>

            {/* Highlights */}
            <div className="relative space-y-4">
              {highlights.map((text, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:bg-white/10"
                >
                  <CheckCircle2 size={22} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  <span className="text-[15px] text-slate-200">{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Right Side - Form */}
          <section className="flex items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Chào mừng</p>
                  <h2 className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <LogIn size={26} />
                </div>
              </div>

              {/* Toggle */}
              <div className="inline-flex rounded-3xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => handleAuthModeChange("login")}
                  className={`rounded-3xl px-8 py-3 text-sm font-semibold transition-all ${
                    isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthModeChange("register")}
                  className={`rounded-3xl px-8 py-3 text-sm font-semibold transition-all ${
                    !isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {!isLogin && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-600">Họ và tên</span>
                    <div className={inputClassName}>
                      <User size={20} className="text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                )}

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">Email</span>
                  <div className={inputClassName}>
                    <Mail size={20} className="text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="ban@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">Mật khẩu</span>
                  <div className={inputClassName}>
                    <Lock size={20} className="text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>

                {!isLogin && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-600">Xác nhận mật khẩu</span>
                    <div className={inputClassName}>
                      <ShieldCheck size={20} className="text-slate-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer note */}
              <div className="text-center text-sm text-slate-500">
                Workspace gọn • Đồng bộ nhanh • Làm việc nhóm dễ dàng
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
