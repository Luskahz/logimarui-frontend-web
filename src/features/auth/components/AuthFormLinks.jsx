import Link from "next/link";
import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";

export default function AuthFormLinks() {
  const auxiliaryLinks = useAuthFormStore(
    (state) => state.content?.auxiliaryLinks ?? [],
  );
  const secondaryLink = useAuthFormStore(
    (state) => state.content?.secondaryLink ?? null,
  );

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      {auxiliaryLinks.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-left">
          {auxiliaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
            >
              <span className="font-semibold text-slate-400 transition-colors duration-150 group-hover:text-slate-950 group-focus-visible:text-slate-950">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {secondaryLink ? (
        <div className="ml-auto shrink-0 text-right">
          <Link
            href={secondaryLink.href}
            className="group rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
          >
            <span className="font-semibold text-slate-400 transition-colors duration-150 group-hover:text-slate-950 group-focus-visible:text-slate-950">
              {secondaryLink.cta}
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
