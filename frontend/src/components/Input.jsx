import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Input Component
 *
 * Usage:
 *   <Input label="Email" type="email" placeholder="you@example.com" />
 *   <Input label="Password" type="password" />   ← auto show/hide toggle
 *   <Input label="Search" leftIcon={<Search size={16} />} />
 *   <Input label="Amount" rightText="USD" />
 *   <Input error="This field is required" />
 *   <Input hint="We'll never share your email." />
 */

const Input = forwardRef(function Input(
  {
    // Label & meta
    label       = "",
    hint        = "",
    error       = "",
    required    = false,

    // Input props
    id,
    type        = "text",
    placeholder = "",
    value,
    onChange,
    onBlur,
    disabled    = false,
    autoComplete,
    name,

    // Addons
    leftIcon    = null,   // React element e.g. <Mail size={16} />
    rightIcon   = null,   // React element (non-interactive)
    rightText   = "",     // e.g. "USD", ".com"

    // Size
    size        = "md",   // sm | md | lg

    className   = "",
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (showPassword ? "text" : "password") : type;

  // ── Sizes ──────────────────────────────────────────────────────────────────
  const sizeStyles = {
    sm: "py-2 text-xs",
    md: "py-3 text-sm",
    lg: "py-3.5 text-base",
  };

  // ── Padding based on addons ────────────────────────────────────────────────
  const pl = leftIcon ? "pl-10" : "pl-4";
  const pr = isPassword || rightIcon || rightText ? "pr-11" : "pr-4";

  // ── Border color ───────────────────────────────────────────────────────────
  const borderStyle = error
    ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
    : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>

      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-mono text-gray-400 uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-brand-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">

        {/* Left icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{leftIcon}</span>
          </div>
        )}

        {/* Input element */}
        <input
          ref={ref}
          id={id}
          name={name || id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full bg-surface-2 border rounded-lg
            text-gray-100 placeholder-gray-500
            focus:outline-none focus:ring-1
            transition-all duration-200
            ${sizeStyles[size]}
            ${pl} ${pr}
            ${borderStyle}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />

        {/* Right side: password toggle / icon / text */}
        <div className="absolute inset-y-0 right-3 flex items-center">
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : rightIcon ? (
            <span className="text-gray-500 pointer-events-none">{rightIcon}</span>
          ) : rightText ? (
            <span className="text-xs font-mono text-gray-500 pointer-events-none">
              {rightText}
            </span>
          ) : null}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 font-body">{error}</p>
      )}

      {/* Hint message */}
      {hint && !error && (
        <p className="text-xs text-gray-500 font-body">{hint}</p>
      )}
    </div>
  );
});

export default Input;