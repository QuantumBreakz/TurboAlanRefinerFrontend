import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// POST /api/workspaces/[workspaceId]/chat - Send message and get AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ 
      error: "Backend not configured",
      success: false,
      reply: "Backend service is not available. Please try again later."
    }, { status: 503 })
  }
  
  const { workspaceId } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ 
      error: "user_id is required",
      success: false 
    }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    
    if (!body.message?.trim()) {
      return NextResponse.json({
        error: "Message cannot be empty",
        success: false
      }, { status: 400 })
    }
    
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/chat?user_id=${encodeURIComponent(userId)}`
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.BACKEND_API_KEY || ""
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ 
      error: "Failed to process chat",
      success: false,
      reply: "I encountered an error. Please try again."
    }, { status: 500 })
  }
}
