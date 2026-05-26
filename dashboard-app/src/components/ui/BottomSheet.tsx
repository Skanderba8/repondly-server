'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              background: 'var(--color-surface)',
              borderRadius: '24px 24px 0 0',
              borderTop: '1px solid var(--color-border)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-border-2)',
              }} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
