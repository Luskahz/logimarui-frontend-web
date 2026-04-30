export default function AuthInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  hint,
  error,
  autoComplete,
  inputMode,
  maxLength,
  required = false,
  onChange,
}) {
  const inputId = `auth-${name}`;
  const descriptionId = `${inputId}-description`;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>

      <input
        id={inputId}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
          error
            ? "border-rose-300 bg-rose-50"
            : "border-black/10 bg-white focus:border-[var(--accent)] focus:bg-[var(--panel)]"
        }`}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? descriptionId : undefined}
        onChange={onChange}
      />

      <span
        id={descriptionId}
        role={error ? "alert" : undefined}
        className={`mt-2 block text-xs leading-6 ${
          error ? "text-rose-600" : "text-slate-500"
        }`}
      >
        {error || hint}
      </span>
    </label>
  );
}
