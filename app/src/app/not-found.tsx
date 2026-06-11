import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100dvh",
      gap: "16px",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "64px", fontWeight: 800, color: "var(--brand-primary)", fontFamily: "'Syne', sans-serif" }}>
        404
      </div>
      <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "320px", margin: 0 }}>
        Cette page n'existe pas.
      </p>
      <Link
        href="/dashboard/accueil"
        style={{
          marginTop: "8px",
          padding: "10px 20px",
          borderRadius: "var(--radius-md)",
          background: "var(--brand-primary)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
