import { randomUUID } from 'crypto'

type SSEClient = {
  id: string
  businessId: string
  controller: ReadableStreamDefaultController
  lastActivity: number
}

class SSEBroadcaster {
  private clients = new Map<string, SSEClient>()

  addClient(businessId: string, controller: ReadableStreamDefaultController) {
    const id = randomUUID()
    this.clients.set(id, { id, businessId, controller, lastActivity: Date.now() })
    return id
  }

  removeClient(id: string) {
    this.clients.delete(id)
  }

  // Broadcast only to clients of the same business (tenant isolation)
  broadcastToBusiness(businessId: string, event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const encoder = new TextEncoder()
    for (const client of this.clients.values()) {
      if (client.businessId === businessId) {
        try {
          client.controller.enqueue(encoder.encode(payload))
          client.lastActivity = Date.now()
        } catch {
          this.clients.delete(client.id)
        }
      }
    }
  }

  // Cleanup stale connections (call periodically)
  cleanup() {
    const staleThreshold = Date.now() - 60_000
    for (const [id, client] of this.clients) {
      if (client.lastActivity < staleThreshold) this.clients.delete(id)
    }
  }
}

export const sseBroadcaster = new SSEBroadcaster()
// Cleanup every 60s
setInterval(() => sseBroadcaster.cleanup(), 60_000)
