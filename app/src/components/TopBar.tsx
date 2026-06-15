interface TopBarProps {
  title: string
  businessName?: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="rp-topbar">
      <div className="rp-topbar-inner grid grid-cols-[30px_1fr_30px] items-center">
        <div className="rp-mobile-logo">R</div>
        <h1 className="truncate text-center text-[14px] font-semibold leading-[1.15] text-[color:var(--color-text-primary)]">{title}</h1>
        <span aria-hidden="true" />
      </div>
    </header>
  )
}
