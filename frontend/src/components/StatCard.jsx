import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard Component
 *
 * Usage:
 *   <StatCard
 *     icon={Users}
 *     label="Total Students"
 *     value="248"
 *     trend={{ value: 12, label: "this month", direction: "up" }}
 *     variant="brand"
 *   />
 *
 * variants: brand | blue | purple | yellow | red | gray
 * sizes:    sm | md | lg
 */

const VARIANTS = {
  brand:  { iconBg: "bg-brand-500/10",  iconColor: "text-brand-400",  border: "hover:border-brand-500/30"  },
  blue:   { iconBg: "bg-blue-500/10",   iconColor: "text-blue-400",   border: "hover:border-blue-500/30"   },
  purple: { iconBg: "bg-purple-500/10", iconColor: "text-purple-400", border: "hover:border-purple-500/30" },
  yellow: { iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400", border: "hover:border-yellow-500/30" },
  red:    { iconBg: "bg-red-500/10",    iconColor: "text-red-400",    border: "hover:border-red-500/30"    },
  gray:   { iconBg: "bg-surface-2",     iconColor: "text-gray-400",   border: "hover:border-surface-3"     },
};

const SIZES = {
  sm: { card: "p-4", icon: "w-9 h-9",  iconSize: 16, value: "text-xl",  label: "text-xs" },
  md: { card: "p-5", icon: "w-11 h-11", iconSize: 20, value: "text-3xl", label: "text-xs" },
  lg: { card: "p-6", icon: "w-12 h-12", iconSize: 22, value: "text-4xl", label: "text-sm" },
};

export default function StatCard({
  // Content
  icon: Icon,
  label       = "",
  value       = "—",
  trend       = null,   // { value: number, label: string, direction: "up"|"down"|"neutral" }
  description = "",     // optional extra line below value

  // Styling
  variant     = "brand",
  size        = "md",
  delay       = "0ms",

  // Interaction
  onClick     = null,
  className   = "",
}) {
  const v = VARIANTS[variant] || VARIANTS.brand;
  const s = SIZES[size]       || SIZES.md;

  const trendColor = trend?.direction === "up"      ? "text-brand-400"
                   : trend?.direction === "down"     ? "text-red-400"
                   : "text-gray-500";

  const TrendIcon  = trend?.direction === "up"      ? TrendingUp
                   : trend?.direction === "down"     ? TrendingDown
                   : Minus;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: delay }}
      className={`
        bg-surface-1 border border-surface-2 rounded-xl
        transition-all duration-200 animate-fade-up
        ${s.card}
        ${v.border}
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Left: label + value + trend */}
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-gray-500 uppercase tracking-wider ${s.label}`}>
            {label}
          </p>
          <p className={`font-display font-bold text-white mt-1.5 ${s.value}`}>
            {value}
          </p>

          {/* Trend */}
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
              <TrendIcon size={12} className="shrink-0" />
              <span className="text-xs font-mono">
                {trend.direction !== "neutral" && (
                  <span className="font-semibold">
                    {trend.direction === "up" ? "+" : "-"}{Math.abs(trend.value)}
                  </span>
                )}{" "}
                {trend.label}
              </span>
            </div>
          )}

          {/* Description (no trend) */}
          {description && !trend && (
            <p className="text-xs text-gray-500 font-body mt-1">{description}</p>
          )}
        </div>

        {/* Right: icon */}
        {Icon && (
          <div className={`${s.icon} ${v.iconBg} rounded-xl
                           flex items-center justify-center shrink-0`}>
            <Icon size={s.iconSize} className={v.iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}