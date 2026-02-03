import { NextRequest, NextResponse } from "next/server"

const backendUrl = process.env.REFINER_BACKEND_URL

// GET /api/workspaces - List workspaces for a user
export async function GET(request: NextRequest) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }
  
  try {
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces?user_id=${encodeURIComponent(userId)}`
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
    console.error("Failed to list workspaces:", error)
    return NextResponse.json({ error: "Failed to list workspaces" }, { status: 500 })
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 })
  }
  
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }
  
  try {
    const body = await request.json().catch(() => ({}))
    const url = `${backendUrl.replace(/\/$/, "")}/workspaces?user_id=${encodeURIComponent(userId)}`
    
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
    console.error("Failed to create workspace:", error)
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }
}
