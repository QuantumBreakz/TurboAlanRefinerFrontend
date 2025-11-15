import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lines = Math.max(1, Math.min(1000, Number.parseInt(searchParams.get("lines") || "200")))
  const backendUrl = process.env.REFINER_BACKEND_URL

  if (backendUrl) {
    try {
      const url = `${backendUrl.replace(/\/$/, "")}/logs?lines=${lines}`
      const upstream = await fetch(url, { cache: "no-store" })
      const data = await upstream.json()
      return NextResponse.json(data, { status: upstream.status })
    } catch {
      // fall through to local mock
    }
  }

  // Fallback mock
  const mock = Array.from({ length: lines }).map((_, i) => ({
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    level: i % 10 === 0 ? "ERROR" : i % 5 === 0 ? "WARN" : "INFO",
    message: i % 10 === 0 ? "Simulated error" : "Simulated log entry",
  }))
  return NextResponse.json({ lines: mock })
}
