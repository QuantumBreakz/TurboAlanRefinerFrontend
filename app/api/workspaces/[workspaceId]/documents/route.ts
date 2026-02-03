import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// GET /api/workspaces/[workspaceId]/documents - Get documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { workspaceId } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }
  
  try {
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/documents?user_id=${encodeURIComponent(userId)}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.BACKEND_API_KEY || ""
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Failed to get documents:", error)
    return NextResponse.json({ error: "Failed to get documents" }, { status: 500 })
  }
}

// POST /api/workspaces/[workspaceId]/documents - Add document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { workspaceId } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces/${workspaceId}/documents?user_id=${encodeURIComponent(userId)}`
    
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
    console.error("Failed to add document:", error)
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 })
  }
}
