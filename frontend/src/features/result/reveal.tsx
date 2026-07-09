import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal — staggered fade-up for result sections. High-stakes medical info, so
 * the reveal is deliberate (500ms) with a tight 70ms stagger, not decorative.
 *
 * Pure CSS: the animation always resolves to the element's visible natural
 * state (never JS/intersection-gated), and `motion-reduce:animate-none` plus the
 * global reduced-motion guard in globals.css render every section instantly for
 * users who prefer reduced motion.
 */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 ease-out motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
