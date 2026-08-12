import type {
  ComponentPropsWithoutRef,
  ElementType,
  HTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const typographyVariants = cva("", {
  variants: {
    variant: {
      // Base primitives kept compatible with the first version of this component.
      heading: "text-2xl font-semibold tracking-tight",
      body: "text-sm text-foreground",
      muted: "text-sm text-muted-foreground",

      // Main application shell.
      pageTitle:
        "font-serif text-3xl text-[var(--shell-text)] sm:text-4xl",
      sectionTitle: "font-serif text-2xl text-[var(--shell-text)]",
      subsectionTitle: "text-xl font-semibold text-[var(--shell-text)]",
      cardTitle: "text-lg font-semibold text-[var(--shell-text)]",
      itemTitle: "text-sm font-semibold text-[var(--shell-text)]",
      shellBody: "text-sm text-[var(--shell-text)]",
      description: "text-sm leading-7 text-[var(--shell-muted)]",
      supportingText: "text-sm leading-6 text-[var(--shell-muted)]",
      shellMuted: "text-sm text-[var(--shell-muted)]",
      label: "text-sm font-semibold text-[var(--shell-text)]",
      caption: "text-xs leading-5 text-[var(--shell-muted)]",
      eyebrow:
        "text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]",
      overline:
        "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]",
      mutedOverline:
        "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]",
      microOverline:
        "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]",
      metric: "text-2xl font-semibold text-[var(--shell-text)]",
      largeMetric: "text-3xl font-semibold text-[var(--shell-text)]",
      code: "font-mono text-xs leading-5 text-[var(--shell-muted)]",

      // Dense typography used by the Crítica de Pedidos dashboard.
      compactTitle:
        "text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted-strong)]",
      compactLabel:
        "text-[0.55rem] font-bold uppercase leading-tight tracking-[0.06em] text-[var(--muted)]",
      compactBody: "text-[0.58rem] leading-snug text-[var(--muted)]",
      compactMetric:
        "font-mono text-[1.08rem] font-black leading-none tracking-normal",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

const defaultElementByVariant = {
  heading: "h1",
  body: "p",
  muted: "p",
  pageTitle: "h1",
  sectionTitle: "h2",
  subsectionTitle: "h3",
  cardTitle: "h3",
  itemTitle: "p",
  shellBody: "p",
  description: "p",
  supportingText: "p",
  shellMuted: "p",
  label: "span",
  caption: "p",
  eyebrow: "p",
  overline: "p",
  mutedOverline: "p",
  microOverline: "p",
  metric: "p",
  largeMetric: "p",
  code: "code",
  compactTitle: "h2",
  compactLabel: "p",
  compactBody: "p",
  compactMetric: "strong",
} as const satisfies Record<TypographyVariant, ElementType>;

export type TypographyProps<TElement extends ElementType = "p"> = {
  as?: TElement;
  variant?: TypographyVariant;
} & Omit<ComponentPropsWithoutRef<TElement>, "as">;

export function Typography<TElement extends ElementType = "p">({
  as,
  variant = "body",
  className,
  ...props
}: TypographyProps<TElement>) {
  const Component = (as ?? defaultElementByVariant[variant]) as ElementType;

  return (
    <Component
      data-slot="typography"
      data-variant={variant}
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

type HeadingVariant =
  | "heading"
  | "pageTitle"
  | "sectionTitle"
  | "subsectionTitle"
  | "cardTitle";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  variant?: HeadingVariant;
};

export function Heading({
  as = "h1",
  variant = "heading",
  ...props
}: HeadingProps) {
  return <Typography as={as} variant={variant} {...props} />;
}

export function PageTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h1" variant="pageTitle" {...props} />;
}

export function SectionTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h2" variant="sectionTitle" {...props} />;
}

export function SubsectionTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h3" variant="subsectionTitle" {...props} />;
}

export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h3" variant="cardTitle" {...props} />;
}

export function Text(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" variant="body" {...props} />;
}

export function MutedText(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" variant="muted" {...props} />;
}

export function Eyebrow(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" variant="eyebrow" {...props} />;
}

export function Description(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" variant="description" {...props} />;
}

export function Metric(props: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" variant="metric" {...props} />;
}
