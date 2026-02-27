import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute } from "../utils/helpers";
import {
  User, Mail, Lock, Eye, EyeOff, Hash,
  Building, Phone, ArrowRight, ArrowLeft,
  CheckCircle2, ChevronDown
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "student", label: "Student",       desc: "Enroll and track your attendance" },
  { value: "teacher", label: "Teacher",       desc: "Manage classes and mark attendance" },
  { value: "admin",   label: "Administrator", desc: "Full system access and control" },
];

const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Mathematics",
  "Physics", "Chemistry", "Biology", "Other",
];

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { number: 1, label: "Account"  },
  { number: 2, label: "Personal" },
  { number: 3, label: "Confirm"  },
];

// ─── Validators ───────────────────────────────────────────────────────────────
const validateStep1 = (form) => {
  const errs = {};
  if (!form.email.trim())
    errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = "Invalid email address";
  if (!form.password)
    errs.password = "Password is required";
  else if (form.password.length < 6)
    errs.password = "Minimum 6 characters";
  if (!form.confirmPassword)
    errs.confirmPassword = "Please confirm your password";
  else if (form.password !== form.confirmPassword)
    errs.confirmPassword = "Passwords do not match";
  return errs;
};

const validateStep2 = (form) => {
  const errs = {};
  if (!form.name.trim())         errs.name         = "Full name is required";
  if (!form.universityId.trim()) errs.universityId = "University ID is required";
  if (!form.role)                errs.role         = "Please select a role";
  return errs;
};

// ─── Reusable field ───────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {label} {required && <span className="text-brand-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function TextInput({ icon: Icon, error, rightEl, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full bg-surface-2 border rounded-lg py-3 text-gray-100
                    placeholder-gray-500 text-sm focus:outline-none focus:ring-1
                    transition-all duration-200
                    ${Icon ? "pl-10" : "px-4"}
                    ${rightEl ? "pr-11" : "pr-4"}
                    ${error
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                      : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                    }`}
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done    = current > step.number;
        const active  = current === step.number;
        return (
          <React.Fragment key={step.number}>
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                               text-xs font-mono font-bold transition-all duration-300
                               ${done   ? "bg-brand-500 text-white"
                               : active ? "bg-brand-500/20 border-2 border-brand-500 text-brand-400"
                                        : "bg-surface-2 border border-surface-3 text-gray-600"}`}>
                {done ? <CheckCircle2 size={14} /> : step.number}
              </div>
              <span className={`text-[10px] font-mono transition-colors
                                ${active ? "text-brand-400" : done ? "text-gray-400" : "text-gray-600"}`}>
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-px mb-4 transition-all duration-500
                               ${done ? "bg-brand-500" : "bg-surface-3"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Register() {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});

  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "",
    name: "", universityId: "", role: "", department: "", phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (error) clearError();
  };

  // ── Step navigation ──────────────────────────────────────────────────────
  const nextStep = () => {
    let errs = {};
    if (step === 1) errs = validateStep1(form);
    if (step === 2) errs = validateStep2(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setFieldErrors({});
    setStep((s) => s - 1);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { confirmPassword, ...payload } = form;
    const result = await register(payload);
    if (result.success) {
      navigate(getDashboardRoute(result.role), { replace: true });
    }
  };

  // ─── Step 1: Account credentials ─────────────────────────────────────────
  const Step1 = (
    <div className="flex flex-col gap-4">
      <Field label="Email address" error={fieldErrors.email} required>
        <TextInput
          icon={Mail}
          type="email"
          name="email"
          placeholder="you@university.edu"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          error={fieldErrors.email}
        />
      </Field>

      <Field label="Password" error={fieldErrors.password} required>
        <TextInput
          icon={Lock}
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          rightEl={
            <button type="button" tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="text-gray-500 hover:text-gray-300 transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </Field>

      <Field label="Confirm Password" error={fieldErrors.confirmPassword} required>
        <TextInput
          icon={Lock}
          type={showConfirm ? "text" : "password"}
          name="confirmPassword"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          rightEl={
            <button type="button" tabIndex={-1}
              onClick={() => setShowConfirm((p) => !p)}
              className="text-gray-500 hover:text-gray-300 transition-colors">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </Field>

      {/* Password strength indicator */}
      {form.password && (
        <div className="flex gap-1.5 items-center">
          {[1,2,3].map((lvl) => {
            const strength = form.password.length >= 10 ? 3
                           : form.password.length >= 6  ? 2 : 1;
            return (
              <div key={lvl}
                className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${lvl <= strength
                              ? strength === 1 ? "bg-red-500"
                              : strength === 2 ? "bg-yellow-500"
                              : "bg-brand-500"
                              : "bg-surface-3"}`}
              />
            );
          })}
          <span className="text-xs font-mono text-gray-500 ml-1">
            {form.password.length >= 10 ? "Strong"
            : form.password.length >= 6  ? "Medium" : "Weak"}
          </span>
        </div>
      )}
    </div>
  );

  // ─── Step 2: Personal info ────────────────────────────────────────────────
  const Step2 = (
    <div className="flex flex-col gap-4">
      <Field label="Full Name" error={fieldErrors.name} required>
        <TextInput
          icon={User}
          type="text"
          name="name"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
      </Field>

      <Field label="University ID" error={fieldErrors.universityId} required>
        <TextInput
          icon={Hash}
          type="text"
          name="universityId"
          placeholder="e.g. U-123456"
          value={form.universityId}
          onChange={handleChange}
          error={fieldErrors.universityId}
        />
      </Field>

      {/* Role selection cards */}
      <Field label="Role" error={fieldErrors.role} required>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => { setForm((p) => ({ ...p, role: r.value })); setFieldErrors((p) => ({ ...p, role: "" })); }}
              className={`p-3 rounded-lg border text-left transition-all duration-150
                          ${form.role === r.value
                            ? "border-brand-500 bg-brand-500/10 text-brand-400"
                            : "border-surface-3 bg-surface-2 text-gray-400 hover:border-surface-4"
                          }`}
            >
              <p className="text-xs font-display font-semibold">{r.label}</p>
              <p className="text-[10px] font-mono mt-0.5 leading-tight opacity-70">{r.desc}</p>
            </button>
          ))}
        </div>
      </Field>

      {/* Department */}
      <Field label="Department">
        <div className="relative">
          <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full bg-surface-2 border border-surface-3 rounded-lg
                       py-3 pl-10 pr-10 text-gray-100 text-sm appearance-none
                       focus:outline-none focus:border-brand-500 focus:ring-1
                       focus:ring-brand-500/30 transition-all duration-200 cursor-pointer"
          >
            <option value="">Select department (optional)</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </Field>

      {/* Phone */}
      <Field label="Phone">
        <TextInput
          icon={Phone}
          type="tel"
          name="phone"
          placeholder="+91 98765 43210 (optional)"
          value={form.phone}
          onChange={handleChange}
        />
      </Field>
    </div>
  );

  // ─── Step 3: Review & confirm ─────────────────────────────────────────────
  const Step3 = (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500 mb-2">
        Please review your details before submitting.
      </p>

      {[
        { label: "Email",         value: form.email },
        { label: "Full Name",     value: form.name },
        { label: "University ID", value: form.universityId },
        { label: "Role",          value: ROLES.find((r) => r.value === form.role)?.label || "—" },
        { label: "Department",    value: form.department || "—" },
        { label: "Phone",         value: form.phone      || "—" },
      ].map(({ label, value }) => (
        <div key={label}
          className="flex items-center justify-between py-2.5 px-4
                     bg-surface-2 rounded-lg border border-surface-3">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</span>
          <span className="text-sm text-gray-200 font-body">{value}</span>
        </div>
      ))}

      {error && (
        <div className="mt-2 px-4 py-3 bg-red-500/10 border border-red-500/20
                        rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12
                          bg-brand-500/10 border border-brand-500/20 rounded-xl mb-4">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">SA</span>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Smart Attendance System</p>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Card */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-6
                        shadow-2xl shadow-black/40">

          <form onSubmit={handleSubmit} noValidate>
            {/* Step title */}
            <h2 className="font-display font-semibold text-white mb-5 text-sm">
              {step === 1 && "Step 1 — Account Credentials"}
              {step === 2 && "Step 2 — Personal Information"}
              {step === 3 && "Step 3 — Review & Confirm"}
            </h2>

            {/* Step content */}
            {step === 1 && Step1}
            {step === 2 && Step2}
            {step === 3 && Step3}

            {/* Navigation buttons */}
            <div className={`flex gap-3 mt-6 ${step > 1 ? "justify-between" : ""}`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg
                             bg-surface-2 hover:bg-surface-3 border border-surface-3
                             text-gray-300 hover:text-white text-sm font-display
                             transition-all duration-200 active:scale-[0.98]"
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2
                             bg-brand-500 hover:bg-brand-400 text-white
                             py-3 px-6 rounded-lg font-display text-sm
                             transition-all duration-200 active:scale-[0.98]
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2
                             bg-brand-500 hover:bg-brand-400 disabled:opacity-50
                             disabled:cursor-not-allowed text-white
                             py-3 px-6 rounded-lg font-display text-sm
                             transition-all duration-200 active:scale-[0.98]
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30
                                    border-t-white animate-spin" />
                  ) : (
                    <><CheckCircle2 size={15} /> Create Account</>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/login"
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}