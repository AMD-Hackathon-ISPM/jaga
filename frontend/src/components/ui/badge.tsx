import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "warning" | "error" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  info: "bg-info-surface text-info",
  warning: "bg-warning-surface text-warning",
  error: "bg-error-surface text-error",
  success: "bg-surface text-success border border-border-strong",
};

/** Badge / tag — pill radius is allowed here (design §5.5). Text label always present. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-sm", tones[tone], className)}
      {...props}
    />
  );
}
