import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Input — sunken well + strong outline (design §6). Numeric inputs should pass
 * inputMode and use the mono font via className. Error state via `invalid`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-[44px] w-full rounded-control bg-surface-sunken px-3 text-base text-ink",
        "border border-border-strong placeholder:text-ink-muted",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus",
        invalid && "border-error bg-error-surface",
        className,
      )}
      {...props}
    />
  );
});
