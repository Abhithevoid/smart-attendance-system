import React from "react";

/**
 * Button Component
 * 
 * variants: primary | secondary | danger | ghost | outline
 * sizes:    sm | md | lg
 * 
 * Usage:
 *   <Button>Click me</Button>
 *   <Button variant="danger" size="sm">Delete</Button>
 *   <Button loading>Saving...</Button>
 *   <Button variant="outline" leftIcon={<Plus size={16} />}>Add</Button>
 */

export default function Button({
  children,
  variant   = "primary",
  size      = "md",
  loading   = false,
  disabled  = false,
  fullWidth = false,
  leftIcon  = null,
  rightIcon = null,
  onClick,
  type      = "button",
  className = "",
}) {
  // ─── Size styles ────────────────────────────────────────────────────────────
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3   text-base gap-2.5",
  };

  // ─── Variant styles ──────────────────────────────────────────────────────────
  const variants = {
    primary: `
      bg-brand-500 hover:bg-brand-400 active:bg-brand-600
      text-white border border-transparent
      focus:ring-2 focus:ring-brand-500/40
    `,
    secondary: `
      bg-surface-2 hover:bg-surface-3 active:bg-surface-2
      text-gray-300 hover:text-white border border-surface-3
      hover:border-surface-4 focus:ring-2 focus:ring-surface-3
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500 active:bg-red-600
      text-red-400 hover:text-white border border-red-500/30
      hover:border-red-500 focus:ring-2 focus:ring-red-500/40
    `,
    ghost: `
      bg-transparent hover:bg-surface-2 active:bg-surface-3
      text-gray-400 hover:text-white border border-transparent
      focus:ring-2 focus:ring-surface-3
    `,
    outline: `
      bg-transparent hover:bg-brand-500/10 active:bg-brand-500/20
      text-brand-400 hover:text-brand-300 border border-brand-500/40
      hover:border-brand-500 focus:ring-2 focus:ring-brand-500/30
    `,
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-display font-medium rounded-lg
        transition-all duration-200
        focus:outline-none
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizes[size]}
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {/* Left icon or spinner */}
      {loading ? (
        <span className={`
          rounded-full border-2 animate-spin shrink-0
          ${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"}
          ${variant === "primary" ? "border-white/30 border-t-white"
          : variant === "danger" && !disabled ? "border-red-300/30 border-t-white"
          : "border-gray-500/30 border-t-gray-300"}
        `} />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      {/* Label */}
      <span>{children}</span>

      {/* Right icon */}
      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}