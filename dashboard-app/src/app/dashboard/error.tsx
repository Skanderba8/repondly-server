"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60dvh",
      gap: "16px",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "40px" }}>⚠️</div>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
        Une erreur s'est produite
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "320px" }}>
        Quelque chose s'est mal passé. Veuillez réessayer.
      </p>
      <Button onClick={reset} variant="outline">Réessayer</Button>
    </div>
  )
}
