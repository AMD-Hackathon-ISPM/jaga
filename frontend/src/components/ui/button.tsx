import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Muted disabled look: readable ink on sunken surface (WCAG AA). White on
// #C5C5C5 failed contrast (~1.6:1).
const DISABLED_FILL =
  "disabled:border-border-subtle disabled:bg-surface-sunken disabled:text-ink-muted";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-sans text-base font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary / Continue: teal fill, white text.
        default: `bg-primary text-primary-foreground hover:opacity-90 active:opacity-100 ${DISABLED_FILL}`,
        primary: `bg-primary text-primary-foreground hover:opacity-90 active:opacity-100 ${DISABLED_FILL}`,
        // Return: orange fill with ink text (white fails AA on #FFA450).
        return: `bg-accent-return text-ink hover:brightness-95 active:brightness-90 ${DISABLED_FILL}`,
        // Secondary: white surface, teal hairline, ink text.
        secondary: `border border-brand bg-card text-ink hover:bg-tint-brand-5 ${DISABLED_FILL}`,
        tertiary: "bg-transparent text-primary hover:underline disabled:opacity-60",
        destructive: `bg-destructive text-white hover:opacity-90 ${DISABLED_FILL}`,
        // Outline: white surface, teal hairline, ink text.
        outline: `border border-brand bg-card text-ink hover:bg-tint-brand-5 ${DISABLED_FILL}`,
        ghost: "bg-transparent hover:bg-muted hover:text-foreground disabled:opacity-60",
      },
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 text-xs",
        sm: "min-h-9 px-3 text-sm",
        md: "min-h-11 px-4",
        lg: "min-h-12 px-5",
        "icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
