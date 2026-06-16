import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent/20 text-accent border border-accent/30",
        numeric: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        categorical: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
        outline: "text-white/70 border border-glass-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
