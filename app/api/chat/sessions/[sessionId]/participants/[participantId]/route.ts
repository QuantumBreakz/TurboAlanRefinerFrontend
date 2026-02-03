import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || "http://localhost:8000"

// DELETE /api/chat/sessions/[sessionId]/participants/[participantId] - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string; participantId: string } }
) {
  try {
    const { sessionId, participantId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${BACKEND_URL}/chat/sessions/${sessionId}/participants/${participantId}?user_id=${userId}`,
      {
        method: "DELETE",
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Remove participant proxy error:", error)
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    )
  }
}
