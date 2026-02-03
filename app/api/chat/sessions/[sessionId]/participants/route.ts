import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || "http://localhost:8000"

// GET /api/chat/sessions/[sessionId]/participants - Get participants
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${BACKEND_URL}/chat/sessions/${sessionId}/participants?user_id=${userId}`
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Get participants proxy error:", error)
    return NextResponse.json(
      { error: "Failed to get participants" },
      { status: 500 }
    )
  }
}

// POST /api/chat/sessions/[sessionId]/participants - Add participant
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    const response = await fetch(
      `${BACKEND_URL}/chat/sessions/${sessionId}/participants?user_id=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Add participant proxy error:", error)
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    )
  }
}
