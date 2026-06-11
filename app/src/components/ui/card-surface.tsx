import { cn } from "@/lib/utils"

interface CardSurfaceProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  interactive?: boolean
}

export function CardSurface({ className, children, onClick, interactive }: CardSurfaceProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--surface-0)] border border-[var(--surface-border)]",
        "shadow-[var(--shadow-card)]",
        interactive && "cursor-pointer transition-all duration-[var(--transition-base)] hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  )
}
