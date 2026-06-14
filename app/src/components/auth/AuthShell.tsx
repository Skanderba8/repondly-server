'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

type NetworkNode = {
  x: number
  y: number
  radius: number
}

type RgbColor = {
  r: number
  g: number
  b: number
}

const NODE_POSITIONS = [
  { x: 0.5, y: 0.46 },
  { x: 0.2, y: 0.27 },
  { x: 0.74, y: 0.3 },
  { x: 0.82, y: 0.57 },
  { x: 0.35, y: 0.67 },
  { x: 0.63, y: 0.76 },
  { x: 0.11, y: 0.52 },
  { x: 0.58, y: 0.18 },
  { x: 0.29, y: 0.84 },
  { x: 0.9, y: 0.38 },
] as const

const EDGES = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [1, 7],
  [2, 3],
  [4, 5],
  [4, 8],
  [3, 9],
] as const

function parseHexColor(value: string): RgbColor {
  const normalized = value.trim().replace('#', '')

  if (normalized.length !== 6) {
    return { r: 0, g: 122, b: 255 }
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgba(color: RgbColor, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return

    const canvasContext = canvasElement.getContext('2d')
    if (!canvasContext) return

    const canvas = canvasElement
    const context = canvasContext
    const brandColor = parseHexColor(
      getComputedStyle(canvas).getPropertyValue('--brand-primary'),
    )
    const pixelRatio = window.devicePixelRatio || 1
    let animationFrame = 0
    let width = 0
    let height = 0
    let nodes: NetworkNode[] = []

    function resize() {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width * pixelRatio
      canvas.height = height * pixelRatio
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      nodes = NODE_POSITIONS.map((position, index) => ({
        x: position.x * width,
        y: position.y * height,
        radius: index === 0 ? 7 : 3.25 + (index % 3) * 0.55,
      }))
    }

    function draw(timestamp: number) {
      context.clearRect(0, 0, width, height)

      const cycleDuration = 5200
      const signalDuration = 1500
      const receiveWindow = 0.18
      const receiveIntensity = new Array(nodes.length).fill(0) as number[]

      EDGES.forEach(([from, to], edgeIndex) => {
        const start = nodes[from]
        const end = nodes[to]
        if (!start || !end) return

        const distance = Math.hypot(start.x - end.x, start.y - end.y)
        const lineAlpha = Math.max(0.045, 0.14 * (1 - distance / (width * 0.72)))

        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.strokeStyle = rgba(brandColor, lineAlpha)
        context.lineWidth = 0.75
        context.stroke()

        const offset = edgeIndex * 390
        const cycleTime = (timestamp + offset) % cycleDuration
        if (cycleTime > signalDuration) return

        const progress = cycleTime / signalDuration
        const easeProgress = progress * progress * (3 - 2 * progress)
        const x = start.x + (end.x - start.x) * easeProgress
        const y = start.y + (end.y - start.y) * easeProgress
        const tailProgress = Math.max(0, easeProgress - 0.12)
        const tailX = start.x + (end.x - start.x) * tailProgress
        const tailY = start.y + (end.y - start.y) * tailProgress
        const fade = Math.sin(progress * Math.PI)

        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(x, y)
        context.strokeStyle = rgba(brandColor, 0.2 * fade)
        context.lineWidth = 1.2
        context.lineCap = 'round'
        context.stroke()
        context.lineCap = 'butt'

        context.beginPath()
        context.arc(x, y, 2.2 + fade * 0.9, 0, Math.PI * 2)
        context.fillStyle = rgba(brandColor, 0.58 * fade)
        context.fill()

        if (progress > 1 - receiveWindow) {
          const receiveProgress = (progress - (1 - receiveWindow)) / receiveWindow
          receiveIntensity[to] = Math.max(
            receiveIntensity[to] ?? 0,
            Math.sin(receiveProgress * Math.PI),
          )
        }
      })

      nodes.forEach((node, index) => {
        const isHub = index === 0
        const receive = receiveIntensity[index] ?? 0
        const glowRadius = node.radius * (isHub ? 3.1 : 2.1) + receive * 7
        const glowAlpha = (isHub ? 0.26 : 0.15) + receive * 0.22

        if (receive > 0.02) {
          context.beginPath()
          context.arc(node.x, node.y, node.radius * 2.8 + receive * 8, 0, Math.PI * 2)
          context.strokeStyle = rgba(brandColor, 0.16 * receive)
          context.lineWidth = 0.9
          context.stroke()
        }

        const glow = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius)
        glow.addColorStop(0, rgba(brandColor, glowAlpha))
        glow.addColorStop(1, rgba(brandColor, 0))

        context.beginPath()
        context.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
        context.fillStyle = glow
        context.fill()

        context.beginPath()
        context.arc(node.x, node.y, node.radius + receive * 1.2, 0, Math.PI * 2)
        context.fillStyle = rgba(brandColor, (isHub ? 0.88 : 0.58) + receive * 0.22)
        context.fill()
      })

      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="rp-auth-network" aria-hidden="true" />
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="rp-auth-root dark">
      <section className="rp-auth-panel" aria-hidden="true">
        <NetworkCanvas />
        <div className="rp-auth-mark">R</div>

        <div className="rp-auth-panel-content">
          <div className="rp-auth-brand">
            <Image
              src="/logo.png"
              alt=""
              width={26}
              height={26}
              priority
              className="rp-auth-logo-image"
            />
            <span>Répondly<em>.</em></span>
          </div>

          <div className="rp-auth-panel-copy">
            <p>Messagerie unifiée pour WhatsApp, Instagram et Facebook.</p>
            <p>Un espace clair pour répondre vite, suivre chaque client et garder le contrôle.</p>
          </div>
        </div>
      </section>

      <section className="rp-auth-stage" aria-label="Authentification Répondly">
        <div className="rp-auth-mobile-brand" aria-hidden="true">
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            priority
            className="rp-auth-logo-image"
          />
          <span>Répondly<em>.</em></span>
        </div>

        <div className="rp-auth-card">
          <div className="rp-auth-card-header">
            <p className="rp-auth-eyebrow">Espace entreprise</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="rp-auth-card-body">{children}</div>
        </div>
      </section>
    </main>
  )
}
