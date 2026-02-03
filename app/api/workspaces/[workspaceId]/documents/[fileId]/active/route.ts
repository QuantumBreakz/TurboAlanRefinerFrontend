import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// PUT /api/workspaces/[workspaceId]/documents/[fileId]/active - Set active document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; fileId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { workspaceId, fileId } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }
  
  try {
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/documents/${fileId}/active?user_id=${encodeURIComponent(userId)}`
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.BACKEND_API_KEY || ""
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Failed to set active document:", error)
    return NextResponse.json({ error: "Failed to set active document" }, { status: 500 })
  }
}
