'use client'

export function playNotificationSound() {
  try {
    const audioWindow = window as Window & {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext

    if (!AudioContextConstructor) {
      return
    }

    const ctx = new AudioContextConstructor()
    const gain = ctx.createGain()
    const first = ctx.createOscillator()
    const second = ctx.createOscillator()
    const now = ctx.currentTime

    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    gain.gain.setValueAtTime(0.08, now + 0.16)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26)

    first.frequency.setValueAtTime(880, now)
    first.connect(gain)
    first.start(now)
    first.stop(now + 0.15)

    second.frequency.setValueAtTime(1100, now + 0.16)
    second.connect(gain)
    second.start(now + 0.16)
    second.stop(now + 0.26)

    second.addEventListener('ended', () => {
      void ctx.close()
    })
  } catch {
  }
}
