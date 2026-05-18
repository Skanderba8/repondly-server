import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Test bot webhook
    let botWorking = false
    try {
      const botRes = await fetch('http://127.0.0.1:3001/health')
      if (botRes.ok) {
        const botData = await botRes.json()
        botWorking = botData.status === 'ok'
      }
    } catch {
      botWorking = false
    }

    // Test dashboard webhook (the actual Chatwoot webhook endpoint)
    let dashboardWorking = false
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004'
      const webhookSecret = process.env.CHATWOOT_WEBHOOK_SECRET
      const dashboardRes = await fetch(`${baseUrl}/api/chatwoot/webhook`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-chatwoot-webhook-token': webhookSecret || '',
        },
        body: JSON.stringify({ event: 'ping', account: { id: '0' } }),
      })
      dashboardWorking = dashboardRes.ok
    } catch {
      dashboardWorking = false
    }

    return NextResponse.json({
      success: true,
      data: {
        bot: botWorking,
        dashboard: dashboardWorking,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test des webhooks',
    }, { status: 500 })
  }
}
