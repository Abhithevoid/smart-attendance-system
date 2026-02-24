import React from "react";
function InputField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required,
  autoComplete,
  disabled,
  hint,
  icon: Icon,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-mono text-gray-400 uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-brand-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon size={16} className="text-gray-500" />
          </div>
        )}

        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            input-base
            ${Icon ? "pl-10" : ""}
            ${error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 font-body">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500 font-body">{hint}</p>
      )}
    </div>
  );
}

export default InputField;