import { Skeleton } from "@/components/ui/skeleton"

export default function AccueilLoading() {
  return (
    <div style={{ padding: "clamp(16px, 5vw, 36px)", maxWidth: 960, margin: "0 auto", paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Skeleton style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton style={{ width: 180, height: 22, borderRadius: 6 }} />
          <Skeleton style={{ width: 100, height: 12, borderRadius: 4 }} />
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: "var(--surface-0)",
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-card)",
            padding: "18px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 110,
          }}>
            <Skeleton style={{ width: 34, height: 34, borderRadius: 10 }} />
            <Skeleton style={{ width: 52, height: 34, borderRadius: 8 }} />
            <Skeleton style={{ width: "70%", height: 13, borderRadius: 6 }} />
            <Skeleton style={{ width: "50%", height: 11, borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* 2 quick action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <Skeleton style={{ width: "100%", height: 56, borderRadius: "var(--radius-md)" }} />
        <Skeleton style={{ width: "100%", height: 56, borderRadius: "var(--radius-md)" }} />
      </div>

      {/* Skeleton chart */}
      <div style={{
        background: "var(--surface-0)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-card)",
        padding: "20px 16px 16px",
        boxShadow: "var(--shadow-card)",
      }}>
        <Skeleton style={{ width: 140, height: 16, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Skeleton style={{ width: "100%", maxWidth: 32, height: `${20 + ((i * 13) % 80)}%`, borderRadius: "6px 6px 2px 2px" }} />
              <Skeleton style={{ width: 20, height: 10, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
