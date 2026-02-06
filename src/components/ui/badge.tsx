import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20",
        outline: "text-foreground border-border hover:bg-muted/50",
        success: "border-transparent bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-neon-emerald shadow-sm shadow-emerald-500/10",
        warning: "border-transparent bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-neon-amber shadow-sm shadow-amber-500/10",
        info: "border-transparent bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-neon-blue shadow-sm shadow-blue-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
