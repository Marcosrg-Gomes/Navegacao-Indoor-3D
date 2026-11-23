import React, { useId, cloneElement, isValidElement } from "react";

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
  const fieldId = useId();
  const input = isValidElement(children as any)
    ? cloneElement(children as any, { id: fieldId })
    : children;
  return (
    <label className={`field ${className}`} htmlFor={fieldId}>
      <span className="field-label">
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      </span>
      {input}
      {hint && <span className="field-hint muted">{hint}</span>}
      {error && <span className="field-error" style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</span>}
    </label>
  );
}

export default FormField;
