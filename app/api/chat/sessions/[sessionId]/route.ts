import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface RouteContext {
  params: {
    sessionId: string
  }
}

/**
 * Individual Chat Session API Proxy
 * Handles GET, PATCH, DELETE for specific sessions
 */

export async function GET(request: NextRequest, context: RouteContext) {
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

    const backendApiUrl = `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to get session" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Get session error:", error)
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const backendApiUrl = `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "PATCH",
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
        payload || { error: "Failed to rename session" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Rename session error:", error)
    return NextResponse.json(
      { error: "Failed to rename session" },
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

    const backendApiUrl = `${backendUrl}/chat/sessions/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`

    const backendResponse = await fetch(backendApiUrl, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || { error: "Failed to delete session" },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Delete session error:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    )
  }
}
