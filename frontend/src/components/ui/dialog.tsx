"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog — Radix Dialog under the bespoke §4/§6 token skin (design §6
 * reset-confirmation pattern). Radix provides the focus trap, scroll lock,
 * Escape handling, portal (escapes stacking context), and ARIA wiring; every
 * visual class stays on the OKLCH tokens — no default shadcn/Radix theme is
 * imported. `Modal` is an alias of this. Placeholder: no business logic.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-backdrop bg-black/40" />
        <RadixDialog.Content
          // No aria-describedby: the body is freeform; this avoids the dev-only Radix warning.
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-modal w-[calc(100%-2rem)] max-w-flow -translate-x-1/2 -translate-y-1/2",
            "rounded-control border border-border-subtle bg-surface p-5 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]",
            className,
          )}
        >
          <RadixDialog.Title className="mb-3 font-serif text-xl font-semibold">{title}</RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
