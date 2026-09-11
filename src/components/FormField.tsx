import React from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  className = "",
  required,
  children,
}: FormFieldProps) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      </span>
      {children}
      {hint && <span className="field-hint muted">{hint}</span>}
      {error && <span className="field-error" style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</span>}
    </label>
  );
}

export default FormField;
