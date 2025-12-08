/**
 * Get Subscription API Route
 * Proxies requests to backend Stripe service.
 */
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || process.env.REFINER_BACKEND_URL || 'http://localhost:8000'
    
    // Proxy request to backend
    const response = await fetch(`${backendUrl}/stripe/subscription/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to get subscription' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to get subscription" },
      { status: 500 }
    )
  }
}

