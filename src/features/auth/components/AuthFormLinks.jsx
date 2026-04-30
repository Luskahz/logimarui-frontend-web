import Link from "next/link";

export default function AuthFormLinks({
  helperText,
  secondaryLink,
  auxiliaryLinks = [],
}) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm leading-7 text-slate-500">{helperText}</p>

      {secondaryLink ? (
        <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-center text-sm text-slate-600">
          <span>{secondaryLink.label} </span>
          <Link
            href={secondaryLink.href}
            className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          >
            {secondaryLink.cta}
          </Link>
        </div>
      ) : null}

      {auxiliaryLinks.length ? (
        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          {auxiliaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-black/8 px-4 py-2 transition hover:border-slate-950 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
