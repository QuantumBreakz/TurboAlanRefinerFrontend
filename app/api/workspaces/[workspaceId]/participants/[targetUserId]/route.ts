import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// DELETE /api/workspaces/[workspaceId]/participants/[targetUserId] - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; targetUserId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { workspaceId, targetUserId } = await params
  const { searchParams } = new URL(request.url)
  const removedBy = searchParams.get("removed_by")
  
  if (!removedBy) {
    return NextResponse.json({ error: "removed_by is required" }, { status: 400 })
  }
  
  try {
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/participants/${targetUserId}?removed_by=${encodeURIComponent(removedBy)}`
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.BACKEND_API_KEY || ""
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Failed to remove participant:", error)
    return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 })
  }
}
