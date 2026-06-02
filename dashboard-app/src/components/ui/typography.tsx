import { cn } from "@/lib/utils"

type TextProps = { className?: string; children: React.ReactNode }

export function H1({ className, children }: TextProps) {
  return <h1 className={cn("text-2xl font-bold tracking-tight text-[var(--text-primary)]", className)}>{children}</h1>
}
export function H2({ className, children }: TextProps) {
  return <h2 className={cn("text-xl font-semibold tracking-tight text-[var(--text-primary)]", className)}>{children}</h2>
}
export function H3({ className, children }: TextProps) {
  return <h3 className={cn("text-base font-semibold text-[var(--text-primary)]", className)}>{children}</h3>
}
export function Body({ className, children }: TextProps) {
  return <p className={cn("text-sm text-[var(--text-secondary)] leading-relaxed", className)}>{children}</p>
}
export function Caption({ className, children }: TextProps) {
  return <span className={cn("text-xs text-[var(--text-muted)]", className)}>{children}</span>
}
export function Label({ className, children }: TextProps) {
  return <span className={cn("text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]", className)}>{children}</span>
}
