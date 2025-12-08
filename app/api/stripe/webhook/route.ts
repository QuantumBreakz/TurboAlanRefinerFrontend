/**
 * Stripe Webhook API Route
 * Proxies webhook events to backend Stripe service.
 * 
 * Note: Primary webhook handling should be done in the backend.
 * This route can be used as a fallback or for frontend-specific processing.
 */
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const sig = request.headers.get('stripe-signature')
    
    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || process.env.REFINER_BACKEND_URL || 'http://localhost:8000'
    
    // Get raw body
    const body = await request.arrayBuffer()
    
    // Proxy webhook to backend
    const response = await fetch(`${backendUrl}/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': sig,
      },
      body: body,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Webhook processing failed' }))
      return NextResponse.json(
        { error: error.detail || 'Webhook processing failed' },
        { status: response.status }
      )
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Webhook handler error' },
      { status: 500 }
    )
  }
}


