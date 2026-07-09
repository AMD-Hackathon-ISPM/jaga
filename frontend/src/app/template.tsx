import type { ReactNode } from "react";

/**
 * Route transition wrapper. `template.tsx` re-mounts on every navigation, so a
 * single CSS enter animation gives each route a quiet fade + small rise.
 * Pure CSS (tw-animate-css utilities); disabled under prefers-reduced-motion
 * via `motion-reduce:animate-none` plus the global guard in globals.css.
 * Server component (no client hooks needed).
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none">
      {children}
    </div>
  );
}
