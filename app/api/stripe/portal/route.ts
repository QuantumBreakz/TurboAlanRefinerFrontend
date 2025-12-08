/**
 * Stripe Customer Portal API Route
 * Proxies requests to backend Stripe service.
 */
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || process.env.REFINER_BACKEND_URL || 'http://localhost:8000'
    
    // Proxy request to backend
    const response = await fetch(`${backendUrl}/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to create portal session' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create portal session" },
      { status: 500 }
    )
  }
}

