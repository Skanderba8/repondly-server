'use client'

import { Button } from '@/components/ui/Button'

export type UpgradeModalState = {
  title: string
  body: string
  currentUsage?: number
  currentLimit?: number
} | null

type UpgradeModalProps = {
  modal: UpgradeModalState
  onClose: () => void
}

export function UpgradeModal({ modal, onClose }: UpgradeModalProps) {
  if (!modal) return null

  return (
    <div className="nx-modal-backdrop z-[95]">
      <div className="nx-card w-full max-w-md p-5">
        <p className="nx-section-label">Limite atteinte</p>
        <h2 className="mt-1 text-[18px] font-bold text-[color:var(--text-primary)]">{modal.title}</h2>
        <p className="mt-3 text-[13px] leading-6 text-[color:var(--text-secondary)]">{modal.body}</p>
        {modal.currentLimit !== undefined && modal.currentUsage !== undefined ? (
          <p className="mt-3 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3 text-[13px] text-[color:var(--text-secondary)]">
            Utilisation actuelle: {modal.currentUsage} / {modal.currentLimit}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <a href="/settings#plan-utilisation" className="nx-btn nx-btn-primary flex-1">Voir les plans</a>
          <Button variant="ghost" className="flex-1" onClick={onClose}>Plus tard</Button>
        </div>
      </div>
    </div>
  )
}
