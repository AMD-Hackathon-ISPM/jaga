"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Dialog — native <dialog> (escapes stacking context; design §6 reset-confirmation
 * pattern). Placeholder: no business logic. Modal is an alias of this.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className={cn(
        "max-w-flow rounded-control border border-border-subtle bg-surface p-5 text-ink backdrop:bg-black/40",
        className,
      )}
    >
      <h2 className="mb-3 font-serif text-xl font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}
