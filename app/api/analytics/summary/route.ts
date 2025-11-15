import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const backendUrl = process.env.REFINER_BACKEND_URL
  if (!backendUrl) {
    return NextResponse.json({ error: "backend not configured" }, { status: 500 })
  }
  
  try {
    const url = `${backendUrl.replace(/\/$/, "")}/analytics/summary`
    const upstream = await fetch(url, {
      headers: { "X-API-Key": process.env.BACKEND_API_KEY || "" },
    })
    
    if (!upstream.ok) {
      return NextResponse.json({ error: `backend_error_${upstream.status}` }, { status: upstream.status })
    }
    
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e) {
    return NextResponse.json({ error: "analytics_request_failed", details: String(e) }, { status: 500 })
  }
}
