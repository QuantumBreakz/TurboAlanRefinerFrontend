import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Chat Sessions API Proxy
 * Forwards requests to backend chat sessions endpoints
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL
    if (!backendUrl) {
      console.error("REFINER_BACKEND_URL not configured")
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 500 }
      )
    }

    const backendApiUrl = `${backendUrl}/chat/sessions?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to list sessions" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("List sessions error:", error)
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL
    if (!backendUrl) {
      console.error("REFINER_BACKEND_URL not configured")
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 500 }
      )
    }

    const backendApiUrl = `${backendUrl}/chat/sessions?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to create session" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Create session error:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    )
  }
}
