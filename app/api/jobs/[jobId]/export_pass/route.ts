import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface RouteContext {
  params: {
    jobId: string
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { jobId } = context.params
    const searchParams = request.nextUrl.searchParams

    const fileId = searchParams.get("file_id")
    const passNumber = searchParams.get("pass")
    const format = searchParams.get("format") || "same"

    if (!jobId || !fileId || !passNumber) {
      return NextResponse.json(
        { status: "error", format: null, download_url: null, warnings: ["missing_parameters"] },
        { status: 400 }
      )
    }

    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL
    if (!backendUrl) {
      console.error("REFINER_BACKEND_URL not configured")
      return NextResponse.json(
        { status: "error", format: null, download_url: null, warnings: ["backend_not_configured"] },
        { status: 500 }
      )
    }

    const backendExportUrl =
      `${backendUrl}/jobs/${encodeURIComponent(jobId)}/export_pass` +
      `?file_id=${encodeURIComponent(fileId)}` +
      `&pass=${encodeURIComponent(passNumber)}` +
      `&format=${encodeURIComponent(format)}`

    const backendResponse = await fetch(backendExportUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      return NextResponse.json(
        payload || {
          status: "error",
          format: null,
          download_url: null,
          warnings: ["backend_export_failed"],
        },
        { status: backendResponse.status },
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Export pass error:", error)
    return NextResponse.json(
      {
        status: "error",
        format: null,
        download_url: null,
        warnings: ["unexpected_export_error"],
      },
      { status: 500 },
    )
  }
}
