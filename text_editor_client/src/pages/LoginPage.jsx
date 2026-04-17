import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login
        await userService.login(formData.email, formData.password);
        navigate("/documents");
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        await userService.register(
          formData.name,
          formData.email,
          formData.password,
        );
        navigate("/documents");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white text-center">
            <LogIn size={40} className="mx-auto mb-3" />
            <h1 className="text-3xl font-bold mb-2">Collaborative Editor</h1>
            <p className="opacity-90">
              {isLogin ? "Welcome Back" : "Create Account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-error gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <div className="input-group">
                <span className="bg-base-300">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="input input-bordered flex-1"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="input-group">
                <span className="bg-base-300">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  className="input input-bordered flex-1"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password (Register Only) */}
            {!isLogin && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-300">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    className="input input-bordered flex-1"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg gap-2 mt-6"
            >
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {isLogin ? "Sign In" : "Create Account"}
            </button>

            {/* Toggle Auth Mode */}
            <div className="divider">OR</div>

            <p className="text-center text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="link link-primary font-semibold ml-1"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>

          {/* Footer */}
          <div className="px-8 py-4 bg-base-200 text-center text-xs text-base-content/60">
            Protected by secure authentication & end-to-end encryption
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center text-base-200 text-sm">
          <p className="mb-2">Demo Credentials:</p>
          <p>
            Email:{" "}
            <code className="bg-base-300 px-2 py-1 rounded">
              demo@example.com
            </code>
          </p>
          <p>
            Password:{" "}
            <code className="bg-base-300 px-2 py-1 rounded">demo123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
