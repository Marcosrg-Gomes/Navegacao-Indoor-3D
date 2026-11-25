import React, { useId, cloneElement, isValidElement } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  required?: boolean;
  /**
   * Id de um controle já renderizado pelo filho (ex.: input dentro de um
   * wrapper flex). Quando informado, o id não é injetado no filho — caso
   * contrário o `for` apontaria para um wrapper e o controle ficaria sem
   * nome acessível.
   */
  htmlFor?: string;
  children: React.ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  className = "",
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const input = htmlFor
    ? children
    : isValidElement(children as any)
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
