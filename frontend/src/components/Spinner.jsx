import React from "react";
function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-[3px]",
  };

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        border-surface-3
        border-t-brand-500
        animate-spin
        ${className}
      `}
    />
  );
}

export default Spinner;