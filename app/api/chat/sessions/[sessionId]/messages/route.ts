import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface RouteContext {
  params: {
    sessionId: string
  }
}

/**
 * Chat Messages API Proxy
 * Handles GET and POST for session messages
 */

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = context.params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")
    const limit = searchParams.get("limit") || "100"

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL
    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 500 }
      )
    }

    const backendApiUrl = 
      `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}/messages` +
      `?user_id=${encodeURIComponent(userId)}&limit=${encodeURIComponent(limit)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to get messages" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = context.params
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
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 500 }
      )
    }

    const backendApiUrl = 
      `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}/messages` +
      `?user_id=${encodeURIComponent(userId)}`

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
        payload || { error: "Failed to add message" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Add message error:", error)
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = context.params
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
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 500 }
      )
    }

    const backendApiUrl = 
      `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}/messages` +
      `?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to clear messages" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Clear messages error:", error)
    return NextResponse.json(
      { error: "Failed to clear messages" },
      { status: 500 },
    )
  }
}
