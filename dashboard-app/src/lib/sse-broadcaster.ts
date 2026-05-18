// SSE Broadcaster - Server-side singleton for real-time push
// Manages SSE connections and broadcasts events to connected clients

type SSEEvent = {
  type: 'message_created' | 'conversation_created' | 'conversation_status_changed' | 'connected'
  data?: any
}

type Controller = ReadableStreamDefaultController

class SSEBroadcaster {
  private connections: Map<string, Set<Controller>> = new Map()

  subscribe(businessId: string, controller: Controller): void {
    if (!this.connections.has(businessId)) {
      this.connections.set(businessId, new Set())
    }
    this.connections.get(businessId)!.add(controller)
  }

  unsubscribe(businessId: string, controller: Controller): void {
    const set = this.connections.get(businessId)
    if (set) {
      set.delete(controller)
      if (set.size === 0) {
        this.connections.delete(businessId)
      }
    }
  }

  broadcast(businessId: string, event: SSEEvent): void {
    const set = this.connections.get(businessId)
    if (!set) return

    const data = `data: ${JSON.stringify(event)}\n\n`
    set.forEach(controller => {
      try {
        controller.enqueue(data)
      } catch (err) {
        console.error('[SSE] Failed to send to controller:', err)
      }
    })
  }
}

// Singleton instance
export const sseBroadcaster = new SSEBroadcaster()
