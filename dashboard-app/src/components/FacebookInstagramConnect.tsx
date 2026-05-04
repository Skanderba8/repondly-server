'use client'

import { useEffect, useRef, useState } from 'react'

interface ConnectedPage {
  id: string
  pageId: string
  pageName: string
  channel: 'FACEBOOK' | 'INSTAGRAM'
  chatwootInboxId: number | null
  createdAt: string
}

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || ''

const SCOPES = [
  'pages_show_list',
  'pages_messaging',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_messages',
].join(',')

function loadFBSDK(onReady: () => void) {
  if (window.FB) {
    window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
    onReady()
    return
  }

  const existing = document.getElementById('facebook-jssdk')
  if (existing) {
    const prev = window.fbAsyncInit
    window.fbAsyncInit = () => {
      prev?.()
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
      onReady()
    }
    return
  }

  window.fbAsyncInit = () => {
    window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: 'v21.0' })
    onReady()
  }

  const script = document.createElement('script')
  script.id = 'facebook-jssdk'
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  script.async = true
  script.defer = true
  document.body.appendChild(script)
}

export default function FacebookInstagramConnect() {
  const [sdkReady, setSdkReady]         = useState(false)
  const [pages, setPages]               = useState<ConnectedPage[]>([])
  const [loadingPages, setLoadingPages] = useState(true)
  const [connecting, setConnecting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadFBSDK(() => { if (mountedRef.current) setSdkReady(true) })
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => { fetchConnectedPages() }, [])

  function fetchConnectedPages() {
    setLoadingPages(true)
    fetch('/api/meta/pages')
      .then(r => r.json())
      .then(data => { if (data.pages) setPages(data.pages) })
      .catch(() => {})
      .finally(() => setLoadingPages(false))
  }

  // ─── The key fix: FB.login callback MUST be a plain (non-async) function ────
  // The FB SDK does a typeof check and throws:
  //   "Expression is of type asyncfunction, not function"
  // if you pass an async callback. Solution: plain function that calls async helper.
  function handleConnect() {
    if (!META_APP_ID) {
      setError('NEXT_PUBLIC_META_APP_ID is not set in your .env file.')
      return
    }
    if (!sdkReady || !window.FB) {
      setError('Facebook SDK not ready yet — please wait a moment and try again.')
      return
    }

    setError(null)
    setSuccess(null)
    setConnecting(true)

    // ✅ Plain function — the FB SDK rejects async functions here
    window.FB.login(
      function (response: any) {
        if (response.status !== 'connected' || !response.authResponse?.accessToken) {
          setConnecting(false)
          if (response.status === 'not_authorized') {
            setError('You declined the permissions. Please try again and accept all permissions.')
          }
          return
        }
        // Hand off to async helper — this is fine because we're no longer inside the FB callback
        connectWithToken(response.authResponse.accessToken)
      },
      {
        scope: SCOPES,
        return_scopes: true,
        auth_type: 'rerequest',
      }
    )
  }

  // ─── Async work happens here, outside the FB.login callback ──────────────────
  async function connectWithToken(fbAccessToken: string) {
    try {
      const res  = await fetch('/api/auth/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fbAccessToken }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Connection failed. Please try again.')
        return
      }

      const summary = (data.results as any[])
        ?.map((r: any) => {
          const parts: string[] = []
          if (r.fb) parts.push('Facebook Messenger')
          if (r.ig) parts.push('Instagram DMs')
          return `${r.page}: ${parts.join(' + ') || 'already connected'}`
        })
        .join(' · ')

      setSuccess(summary || 'Connected successfully!')
      fetchConnectedPages()
    } catch (err: any) {
      setError(err.message || 'Unexpected error. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect(pageId: string, channel: 'FACEBOOK' | 'INSTAGRAM') {
    const label = channel === 'FACEBOOK' ? 'Facebook Messenger' : 'Instagram DMs'
    if (!confirm(`Disconnect ${label} for this page?`)) return
    setError(null)
    try {
      const res = await fetch(`/api/meta/pages?pageId=${pageId}&channel=${channel}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      fetchConnectedPages()
    } catch {
      setError('Failed to disconnect. Please try again.')
    }
  }

  const groupedPages = pages.reduce<Record<string, ConnectedPage[]>>((acc, p) => {
    if (!acc[p.pageName]) acc[p.pageName] = []
    acc[p.pageName].push(p)
    return acc
  }, {})

  const hasConnected = pages.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0d1b2e' }}>Facebook & Instagram</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Connect your Pages to receive and reply to messages in your inbox.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting || !sdkReady}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 16px', borderRadius: 8,
            background: connecting || !sdkReady ? '#94a3b8' : '#1877F2',
            color: '#fff', border: 'none',
            cursor: connecting || !sdkReady ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {connecting ? <><SpinIcon /> Connecting…</> :
           !sdkReady  ? <><SpinIcon /> Loading SDK…</> :
           <><FBIcon /> {hasConnected ? 'Connect More Pages' : 'Connect with Facebook'}</>}
        </button>
      </div>

      {/* Env warning */}
      {!META_APP_ID && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fcd34d', fontSize: 12, color: '#92400e' }}>
          ⚠️ <strong>NEXT_PUBLIC_META_APP_ID</strong> is not set. Add it to <code>.env.local</code> and restart the dev server.
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', fontSize: 13, color: '#991b1b', display: 'flex', gap: 8 }}>
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: 13, color: '#166534', display: 'flex', gap: 8 }}>
          <span>✓</span><span>{success}</span>
        </div>
      )}

      {/* Connected pages */}
      {loadingPages ? (
        <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
          <SpinIcon color="#94a3b8" /> Loading connected pages…
        </div>
      ) : hasConnected ? (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {Object.entries(groupedPages).map(([pageName, connections], i) => (
            <div key={pageName} style={{ padding: '14px 16px', background: '#fff', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1877F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {pageName[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pageName}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 38 }}>
                {connections.map(conn => {
                  const isFb = conn.channel === 'FACEBOOK'
                  return (
                    <div key={conn.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: isFb ? '#eff6ff' : '#fdf4ff', border: `1px solid ${isFb ? '#bfdbfe' : '#e9d5ff'}`, color: isFb ? '#1d4ed8' : '#7c3aed', fontSize: 12, fontWeight: 500 }}>
                      {isFb ? '📘' : '📷'} {isFb ? 'Messenger' : 'Instagram DMs'}
                      <button
                        onClick={() => handleDisconnect(conn.pageId, conn.channel)}
                        title="Disconnect"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5, fontSize: 14, lineHeight: 1, padding: '0 0 0 2px' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                      >×</button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569', fontWeight: 500 }}>No pages connected yet</p>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Click "Connect with Facebook" to link your Pages and Instagram accounts.</p>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
        Répondly requests access to your Pages, Messenger, and Instagram Direct Messages only. We never post on your behalf.
      </p>
    </div>
  )
}

function FBIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function SpinIcon({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ animation: 'fb-spin 0.8s linear infinite' }}>
      <style>{`@keyframes fb-spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}