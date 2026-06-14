interface TopBarProps {
  title: string
  businessName: string
}

export function TopBar({ title, businessName }: TopBarProps) {
  return (
    <header className="rp-topbar">
      <div className="rp-topbar-inner">
        <div className="rp-mobile-logo">R</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{businessName}</p>
          <h1 className="truncate text-[14px] font-semibold leading-[1.15] text-[color:var(--text-primary)]">{title}</h1>
        </div>
      </div>
    </header>
  )
}
