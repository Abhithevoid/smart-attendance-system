import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

/**
 * Alert Component
 *
 * types: success | error | warning | info
 *
 * Usage:
 *   <Alert type="success" message="User registered successfully!" />
 *   <Alert type="error" message="Something went wrong." dismissible />
 *   <Alert type="warning" message="Low attendance detected." autoDismiss={5000} />
 *   <Alert type="info" title="Note" message="Your session expires in 10 minutes." />
 */

const CONFIG = {
  success: {
    icon:       CheckCircle2,
    bg:         "bg-brand-500/10",
    border:     "border-brand-500/25",
    iconColor:  "text-brand-400",
    titleColor: "text-brand-300",
    textColor:  "text-brand-400/80",
    closeColor: "text-brand-400/60 hover:text-brand-300",
  },
  error: {
    icon:       XCircle,
    bg:         "bg-red-500/10",
    border:     "border-red-500/25",
    iconColor:  "text-red-400",
    titleColor: "text-red-300",
    textColor:  "text-red-400/80",
    closeColor: "text-red-400/60 hover:text-red-300",
  },
  warning: {
    icon:       AlertTriangle,
    bg:         "bg-yellow-500/10",
    border:     "border-yellow-500/25",
    iconColor:  "text-yellow-400",
    titleColor: "text-yellow-300",
    textColor:  "text-yellow-400/80",
    closeColor: "text-yellow-400/60 hover:text-yellow-300",
  },
  info: {
    icon:       Info,
    bg:         "bg-blue-500/10",
    border:     "border-blue-500/25",
    iconColor:  "text-blue-400",
    titleColor: "text-blue-300",
    textColor:  "text-blue-400/80",
    closeColor: "text-blue-400/60 hover:text-blue-300",
  },
};

export default function Alert({
  type        = "info",
  title       = "",
  message     = "",
  dismissible = false,
  autoDismiss = null,   // ms — e.g. 5000 for 5 seconds
  onDismiss   = null,   // callback when dismissed
  className   = "",
}) {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  const cfg = CONFIG[type] || CONFIG.info;
  const Icon = cfg.icon;

  // ── Auto dismiss ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoDismiss) return;
    const fadeTimer   = setTimeout(() => setFading(true),  autoDismiss - 400);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismiss);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, [autoDismiss, onDismiss]);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border
        transition-all duration-300
        ${cfg.bg} ${cfg.border}
        ${fading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}
        ${className}
      `}
      role="alert"
    >
      {/* Icon */}
      <Icon size={16} className={`${cfg.iconColor} shrink-0 mt-0.5`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-display font-semibold ${cfg.titleColor}`}>
            {title}
          </p>
        )}
        {message && (
          <p className={`text-sm font-body ${title ? "mt-0.5" : ""} ${cfg.textColor}`}>
            {message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={dismiss}
          className={`shrink-0 transition-colors ${cfg.closeColor}`}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}