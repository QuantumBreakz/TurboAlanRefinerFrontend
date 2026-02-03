import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// POST /api/workspaces/[workspaceId]/participants - Add participant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { workspaceId } = await params
  const { searchParams } = new URL(request.url)
  const addedBy = searchParams.get("added_by")
  
  if (!addedBy) {
    return NextResponse.json({ error: "added_by is required" }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/participants?added_by=${encodeURIComponent(addedBy)}`
    
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
    console.error("Failed to add participant:", error)
    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 })
  }
}
