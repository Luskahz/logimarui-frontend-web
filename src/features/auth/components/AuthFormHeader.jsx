const MODE_LABELS = {
  login: "acesso",
  register: "cadastro",
  "forgot-password": "recuperacao",
  "password-recovery-reset": "nova senha",
};

import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";

export default function AuthFormHeader() {
  const description = useAuthFormStore(
    (state) => state.content?.formDescription || "",
  );
  const mode = useAuthFormStore((state) => state.content?.mode || "login");
  const title = useAuthFormStore((state) => state.content?.formTitle || "");

  return (
    <div className="mb-8 space-y-3">
      <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        {MODE_LABELS[mode] || "auth"}
      </p>
      <h2 className="font-serif text-3xl text-slate-950">{title}</h2>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
