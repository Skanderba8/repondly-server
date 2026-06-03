import { Skeleton } from "@/components/ui/skeleton"

export default function RendezVousLoading() {
  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton style={{ width: 180, height: 26, borderRadius: 6 }} />
          <Skeleton style={{ width: 260, height: 14, borderRadius: 4 }} />
        </div>
        <Skeleton style={{ width: 100, height: 32, borderRadius: 8 }} />
      </div>

      {/* Skeleton booking cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: "var(--surface-0)",
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}>
            <Skeleton style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton style={{ width: "40%", height: 15, borderRadius: 4 }} />
              <Skeleton style={{ width: "60%", height: 12, borderRadius: 4 }} />
            </div>
            <Skeleton style={{ width: 80, height: 24, borderRadius: 9999, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
