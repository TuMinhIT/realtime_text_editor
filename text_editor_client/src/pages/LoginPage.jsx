import React, { useState } from "react";
import { replace, useNavigate } from "react-router-dom";
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
        const response = await userService.login(
          formData.email,
          formData.password,
        );
        if (response) {
          sessionService.setLogin(response.user, response.accessToken);
          navigate("/", { replace: true });
        }

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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(251,191,36,0.22),transparent_35%),radial-gradient(circle_at_90%_95%,rgba(14,116,144,0.2),transparent_42%),linear-gradient(140deg,#fff9f0_0%,#f4f8ff_50%,#f5fbf9_100%)] px-4 py-8 text-slate-900 md:py-12">
      <div className="  overflow-hidden bg-white/50 rounded-4xl border border-white/70 ">
        <section className="flex items-center justify-center p-6 ">
          <div className="w-full max-w-md space-y-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  Text Editor X
                </p>
                <h2 className="mt-2 text-4xl leading-tight tracking-tight text-slate-950">
                  {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
                </h2>
              </div>
            </div>

            <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => handleAuthModeChange("login")}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isLogin
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => handleAuthModeChange("register")}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  !isLogin
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-600">
                    Họ và tên
                  </span>
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
                      className="flex-1 bg-transparent"
                    />
                  </div>
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600">
                  Email
                </span>
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
                <span className="text-sm font-medium text-slate-600">
                  Mật khẩu
                </span>
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
                  <span className="text-sm font-medium text-slate-600">
                    Xác nhận mật khẩu
                  </span>
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-slate-900 to-cyan-900 py-4 text-base font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {isLogin ? "Đăng nhập workspace" : "Tạo tài khoản"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm leading-6 text-slate-500">
              Workspace gọn, tốc độ nhanh, tối ưu cho cộng tác tài liệu nội bộ.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
