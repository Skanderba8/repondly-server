export default function SkeletonCard() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      height: 72,
      borderBottom: '1px solid var(--surface-border)',
    }}>
      <div className="rp-shimmer" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="rp-shimmer" style={{ height: 13, borderRadius: 6, width: '55%' }} />
        <div className="rp-shimmer" style={{ height: 11, borderRadius: 6, width: '80%' }} />
      </div>
      <div className="rp-shimmer" style={{ width: 28, height: 10, borderRadius: 5, flexShrink: 0 }} />
    </div>
  )
}
