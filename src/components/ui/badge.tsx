import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-all select-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
        secondary:
          "border-slate-200/70 bg-slate-100/90 text-slate-700 ring-1 ring-inset ring-slate-200/50",
        destructive:
          "border-rose-200/70 bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/60",
        outline:
          "border-border/80 bg-background text-foreground ring-1 ring-inset ring-border/50",
        success:
          "border-emerald-200/70 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60",
        warning:
          "border-amber-200/70 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60",
        indigo:
          "border-indigo-200/70 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/60",
        solid: "border-transparent bg-slate-900 text-white shadow-2xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
