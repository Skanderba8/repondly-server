import SkeletonCard from "@/components/ui/SkeletonCard"

export default function MessagerieLoading() {
  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", background: "var(--surface-1)" }}>
      {/* Left pane: conversation list skeleton */}
      <div style={{
        width: 360,
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
        borderRight: "1px solid var(--surface-border)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Filter tabs skeleton */}
        <div style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--surface-border)",
          display: "flex",
          gap: 6,
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 80,
              height: 32,
              borderRadius: 9999,
              background: "var(--surface-2)",
            }} />
          ))}
        </div>
        {/* Search skeleton */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--surface-border)" }}>
          <div style={{
            height: 36,
            borderRadius: "var(--radius-input)",
            background: "var(--surface-2)",
          }} />
        </div>
        {/* 5 conversation skeleton items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
