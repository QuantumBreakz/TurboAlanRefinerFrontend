/**
 * Stripe Checkout Session API Route
 * Proxies requests to backend Stripe service.
 */
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || process.env.REFINER_BACKEND_URL || 'http://localhost:8000'
    
    if (!backendUrl || backendUrl === 'http://localhost:8000') {
      console.error('Backend URL not configured. Set NEXT_PUBLIC_REFINER_BACKEND_URL or REFINER_BACKEND_URL')
    }
    
    // Proxy request to backend
    let response: Response
    try {
      response = await fetch(`${backendUrl}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    } catch (fetchError: any) {
      console.error('Failed to connect to backend:', fetchError)
      return NextResponse.json(
        { 
          error: `Failed to connect to backend: ${fetchError.message}. Please check backend URL configuration.` 
        },
        { status: 503 }
      )
    }

    let data: any
    try {
      data = await response.json()
    } catch (jsonError: any) {
      console.error('Failed to parse backend response:', jsonError)
      return NextResponse.json(
        { 
          error: `Backend returned invalid response. Status: ${response.status}` 
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      console.error('Backend error:', {
        status: response.status,
        error: data.detail || data.error || 'Unknown error',
        body: data
      })
      return NextResponse.json(
        { error: data.detail || data.error || 'Failed to create checkout session' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Unexpected error in checkout session route:', e)
    return NextResponse.json(
      { error: e?.message || "Stripe failed" },
      { status: 500 }
    )
  }
}
