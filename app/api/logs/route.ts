import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lines = Math.max(1, Math.min(1000, Number.parseInt(searchParams.get("lines") || "200")))
    const level = searchParams.get("level") || undefined
    
    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL

    if (!backendUrl) {
      console.error("[API] /api/logs: REFINER_BACKEND_URL not configured")
      return NextResponse.json(
        { 
          error: "Backend URL not configured",
          logs: [],
          lines: []
        },
        { status: 503 }
      )
    }

    try {
      let url = `${backendUrl.replace(/\/$/, "")}/logs?lines=${lines}`
      if (level) {
        url += `&level=${encodeURIComponent(level)}`
      }
      
      console.log("[API] /api/logs proxying to:", url)
      
      const upstream = await fetch(url, {
        cache: "no-store",
        headers: {
          "X-API-Key": process.env.BACKEND_API_KEY || "",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!upstream.ok) {
        console.error("[API] /api/logs upstream error:", upstream.status, upstream.statusText)
        return NextResponse.json(
          {
            error: `Backend returned ${upstream.status}`,
            logs: [],
            lines: []
          },
          { status: upstream.status }
        )
      }

      const data = await upstream.json()
      console.log("[API] /api/logs success, received", data.logs?.length || data.lines?.length || 0, "entries")
      return NextResponse.json(data, { status: 200 })
    } catch (fetchError: any) {
      console.error("[API] /api/logs fetch error:", fetchError?.message || fetchError)
      
      // If it's a timeout or connection error, return empty logs instead of mock
      if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('timeout')) {
        return NextResponse.json(
          {
            error: "Backend connection timeout",
            logs: [],
            lines: []
          },
          { status: 504 }
        )
      }

      return NextResponse.json(
        {
          error: `Backend connection failed: ${fetchError?.message || 'Unknown error'}`,
          logs: [],
          lines: []
        },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error("[API] /api/logs unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        logs: [],
        lines: []
      },
      { status: 500 }
    )
  }
}
