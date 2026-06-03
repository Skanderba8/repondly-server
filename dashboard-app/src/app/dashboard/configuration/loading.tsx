import { Skeleton } from "@/components/ui/skeleton"

export default function ConfigurationLoading() {
  return (
    <div style={{ padding: 0, maxWidth: 768, margin: "0 auto" }}>
      {/* Skeleton tabs */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
        backgroundColor: "var(--surface-0)",
        borderBottom: "1px solid var(--surface-border)",
        borderRadius: 0,
        padding: "0 16px",
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}>
        <Skeleton style={{ width: 100, height: 16, borderRadius: 4 }} />
        <Skeleton style={{ width: 120, height: 16, borderRadius: 4 }} />
        <Skeleton style={{ width: 90, height: 16, borderRadius: 4 }} />
      </div>

      {/* Skeleton form fields */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton style={{ width: 80, height: 13, borderRadius: 4 }} />
          <Skeleton style={{ width: "100%", height: 40, borderRadius: "var(--radius-sm)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton style={{ width: 100, height: 13, borderRadius: 4 }} />
          <Skeleton style={{ width: "100%", height: 40, borderRadius: "var(--radius-sm)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton style={{ width: 70, height: 13, borderRadius: 4 }} />
          <Skeleton style={{ width: "100%", height: 100, borderRadius: "var(--radius-sm)" }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Skeleton style={{ width: 120, height: 40, borderRadius: "var(--radius-md)" }} />
          <Skeleton style={{ width: 120, height: 40, borderRadius: "var(--radius-md)" }} />
        </div>
      </div>
    </div>
  )
}
