import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { conversationId, message, systemPrompt } = body

    // Forward request to bot service
    const botRes = await fetch('http://127.0.0.1:3001/api/test-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message, systemPrompt }),
    })

    if (!botRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Bot service unavailable' },
        { status: 503 }
      )
    }

    const result = await botRes.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Bot Test Proxy] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to connect to bot service' },
      { status: 500 }
    )
  }
}
