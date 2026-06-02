'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('rp_app_loaded')) return
    // Mark immediately so navigation during animation never re-shows
    sessionStorage.setItem('rp_app_loaded', '1')
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'var(--surface-1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--brand-primary)',
            letterSpacing: '-0.02em',
          }}>
            Répondly
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--brand-primary)',
                }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
