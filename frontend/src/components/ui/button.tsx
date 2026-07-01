import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-sans text-base font-semibold transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "border border-input bg-card text-card-foreground hover:bg-muted",
        tertiary: "bg-transparent text-primary hover:underline",
        destructive: "bg-destructive text-white hover:opacity-90",
        outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
        ghost: "bg-transparent hover:bg-muted hover:text-foreground",
        recorder: "record-orb",
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
