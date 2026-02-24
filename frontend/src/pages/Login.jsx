import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute } from "../utils/helpers";
import InputField from "../components/InputField";
import Spinner from "../components/Spinner";
import { Mail, Lock, ArrowRight } from "lucide-react";


export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear inline error on type
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (error) clearError();
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

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
          <p className="text-gray-500 text-sm mt-1 font-body">
            Sign in to Smart Attendance System
          </p>
        </div>

        {/* Card */}
        <div className="card border-surface-2 shadow-2xl shadow-black/40">
          {/* Global error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20
                            rounded-lg text-sm text-red-400 font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <InputField
              id="email"
              label="Email address"
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              icon={Mail}
              autoComplete="email"
              required
            />

            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={fieldErrors.password}
              icon={Lock}
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5 font-body">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
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