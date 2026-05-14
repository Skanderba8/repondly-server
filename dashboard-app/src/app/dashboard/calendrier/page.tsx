'use client'

import { Calendar } from 'lucide-react'

const C = {
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  muted: '#8899aa',
  border: '#e2e8f2',
  bg: '#f5f7fa',
}

export default function CalendrierPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: C.muted, padding: 40 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
        <Calendar size={24} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Calendrier — Bientôt disponible</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: 'Inter, sans-serif' }}>La connexion Google Calendar sera disponible dans la prochaine mise à jour.</div>
      </div>
    </div>
  )
}
