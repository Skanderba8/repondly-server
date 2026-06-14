import { NextResponse } from 'next/server'
import {
  createWebhookEventRecord,
  markWebhookEventFailed,
  processWebhookEventRecord,
} from '@/lib/meta/webhooks'

const metaVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN

type MetaObject = 'whatsapp_business_account' | 'page' | 'instagram'

type MetaWebhookPayload = {
  object: MetaObject
  entry?: unknown[]
}

function isMetaObject(value: unknown): value is MetaObject {
  return value === 'whatsapp_business_account' || value === 'page' || value === 'instagram'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !challenge) {
    return NextResponse.json({ success: false, error: 'Invalid webhook verification request.' }, { status: 400 })
  }

  if (!metaVerifyToken) {
    return NextResponse.json({ success: false, error: 'META_WEBHOOK_VERIFY_TOKEN is not configured.' }, { status: 500 })
  }

  if (token !== metaVerifyToken) {
    return NextResponse.json({ success: false, error: 'Webhook verify token mismatch.' }, { status: 403 })
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object' || !('object' in payload) || !isMetaObject(payload.object)) {
    return NextResponse.json({ success: false, error: 'Invalid Meta webhook payload.' }, { status: 400 })
  }

  const eventRecord = await createWebhookEventRecord(payload as MetaWebhookPayload, request.headers)

  try {
    const result = await processWebhookEventRecord(eventRecord.id, payload as MetaWebhookPayload)

    return NextResponse.json({
      success: true,
      data: {
        accepted: true,
        object: payload.object,
        processedItems: result.processedItems,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook processing error.'
    await markWebhookEventFailed(eventRecord.id, message)

    return NextResponse.json({
      success: true,
      data: {
        accepted: true,
        object: payload.object,
        processedItems: 0,
        processingError: message,
      },
    })
  }
}
