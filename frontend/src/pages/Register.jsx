import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute } from "../utils/helpers";
import InputField from "../components/InputField";
import Spinner from "../components/Spinner";
import { User, Mail, Lock, Hash, Building, Phone, ArrowRight, ChevronDown } from "lucide-react";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin",   label: "Administrator" },
];

const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Mathematics",
  "Physics", "Chemistry", "Biology", "Other",
];

export default function Register() {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    universityId: "", role: "student", department: "", phone: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (error) clearError();
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())         errs.name = "Full name is required";
    if (!form.email.trim())        errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                   errs.email = "Invalid email address";
    if (!form.universityId.trim()) errs.universityId = "University ID is required";
    if (!form.password)            errs.password = "Password is required";
    else if (form.password.length < 6)
                                   errs.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword)
                                   errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    const { confirmPassword, ...payload } = form;
    const result = await register(payload);
    if (result.success) {
      navigate(getDashboardRoute(result.role), { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12
                          bg-brand-500/10 border border-brand-500/20 rounded-xl mb-4">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">SA</span>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Create account</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            Join the Smart Attendance System
          </p>
        </div>

        {/* Card */}
        <div className="card border-surface-2 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20
                            rounded-lg text-sm text-red-400 font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Row: name + universityId */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                id="name"
                label="Full Name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                error={fieldErrors.name}
                icon={User}
                required
              />
              <InputField
                id="universityId"
                label="University ID"
                placeholder="U-123456"
                value={form.universityId}
                onChange={handleChange}
                error={fieldErrors.universityId}
                icon={Hash}
                required
              />
            </div>

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

            {/* Role select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Role <span className="text-brand-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="input-base appearance-none pr-10 cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Department select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Department
              </label>
              <div className="relative">
                <Building
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="input-base appearance-none pl-10 pr-10 cursor-pointer"
                >
                  <option value="">Select department (optional)</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <InputField
              id="phone"
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210 (optional)"
              value={form.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
              icon={Phone}
            />

            {/* Row: passwords */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                id="password"
                label="Password"
                type="password"
                placeholder="Min. 6 chars"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
                icon={Lock}
                required
              />
              <InputField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
                icon={Lock}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5 font-body">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}