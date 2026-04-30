import AuthInput from "@/features/auth/components/AuthInput";

export default function AuthFields({
  fields,
  values,
  errors,
  onChange,
}) {
  return fields.map((field) => (
    <AuthInput
      key={field.name}
      label={field.label}
      name={field.name}
      type={field.type}
      placeholder={field.placeholder}
      value={values[field.name] ?? ""}
      hint={field.hint}
      error={errors[field.name]}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      maxLength={field.maxLength}
      required={field.required}
      onChange={onChange}
    />
  ));
}
