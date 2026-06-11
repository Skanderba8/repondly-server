import { cn } from "@/lib/utils"

type Status = "active" | "pending" | "resolved" | "bot" | "human" | "closed"

const config: Record<Status, { label: string; className: string }> = {
  active:   { label: "Actif",    className: "bg-[var(--brand-success-soft)] text-[var(--brand-success)]" },
  pending:  { label: "En attente", className: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning)]" },
  resolved: { label: "Résolu",   className: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
  bot:      { label: "Bot",      className: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" },
  human:    { label: "Humain",   className: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning)]" },
  closed:   { label: "Fermé",    className: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium", c.className, className)}>
      {c.label}
    </span>
  )
}
