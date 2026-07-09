"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal(props: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-500 data-[state=closed]:duration-300 motion-reduce:transition-none motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof SheetPrimitive.Content>) {
  const t = useT();

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-border-subtle bg-canvas p-4 shadow-lg outline-none transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-500 data-[state=closed]:duration-300 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right motion-reduce:transition-none motion-reduce:animate-none",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute right-3 top-3 size-11"
            aria-label={t("common.close")}
          >
            <IconX />
          </Button>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("font-heading text-lg font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-ink-muted", className)} {...props} />;
}

export { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
