import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute } from "../utils/helpers";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    return { email: remembered || "", password: "" };
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("rememberedEmail")
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (error) clearError();
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim())
      errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    if (!form.password)
      errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", form.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(getDashboardRoute(result.role), { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12
                          bg-brand-500/10 border border-brand-500/20 rounded-xl mb-4">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">SA</span>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to Smart Attendance System</p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-6 shadow-2xl shadow-black/40">

          {/* Global error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20
                            rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Email address <span className="text-brand-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={`w-full bg-surface-2 border rounded-lg px-4 py-3 pl-10
                              text-gray-100 placeholder-gray-500 text-sm
                              focus:outline-none focus:ring-1 transition-all duration-200
                              ${fieldErrors.email
                                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                                : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                              }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password with show/hide toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Password <span className="text-brand-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className={`w-full bg-surface-2 border rounded-lg px-4 py-3 pl-10 pr-11
                              text-gray-100 placeholder-gray-500 text-sm
                              focus:outline-none focus:ring-1 transition-all duration-200
                              ${fieldErrors.password
                                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                                : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                              }`}
                />
                {/* Show / Hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRememberMe((p) => !p)}
                className={`w-4 h-4 rounded border flex items-center justify-center
                            transition-all duration-150 shrink-0
                            ${rememberMe
                              ? "bg-brand-500 border-brand-500"
                              : "bg-surface-2 border-surface-3 hover:border-brand-500"
                            }`}
              >
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                onClick={() => setRememberMe((p) => !p)}
                className="text-sm text-gray-400 cursor-pointer select-none"
              >
                Remember me
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50
                         disabled:cursor-not-allowed text-white font-display
                         py-3 px-6 rounded-lg transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-brand-500/50
                         active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/register"
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6 font-mono">
          Smart Attendance System · v1.0.0
        </p>
      </div>
    </div>
  );
}