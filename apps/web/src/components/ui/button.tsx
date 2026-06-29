import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Render the single child element instead of a <button> (e.g. a Link). */
  asChild?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-sans font-semibold " +
  "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 " +
  "focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60";

// All targets meet the 44px minimum (design §5.1).
const sizes: Record<Size, string> = {
  md: "min-h-[44px] px-4 text-base",
  lg: "min-h-[48px] px-5 text-base",
};

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:opacity-90",
  secondary: "bg-surface text-ink border border-border-strong hover:bg-surface-sunken",
  tertiary: "bg-transparent text-brand hover:underline",
  destructive: "bg-error-strong text-white hover:opacity-90",
};

/**
 * Button — token-styled primitive (no shadcn). Covers default/hover/focus/
 * disabled/loading states (design §6). Business logic lives in features.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(base, sizes[size], variants[variant], className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { className: cn(classes, child.props.className) });
  }

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      {children}
    </button>
  );
}
