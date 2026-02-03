import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface RouteContext {
  params: {
    jobId: string
  }
}

/**
 * Production-grade Next.js API route for exporting refined documents to Google Docs.
 * 
 * Proxies requests to the backend FastAPI endpoint with:
 * - Type-safe request/response handling
 * - Comprehensive error handling
 * - Structured response contract
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { jobId } = context.params

    if (!jobId) {
      return NextResponse.json(
        {
          status: "error",
          doc_id: null,
          doc_url: null,
          title: null,
          warnings: ["missing_job_id"],
          error: "Job ID is required"
        },
        { status: 400 }
      )
    }

    // Get optional folder_id from request body
    let folderId: string | null = null
    try {
      const body = await request.json().catch(() => null)
      if (body && body.folder_id) {
        folderId = body.folder_id
      }
    } catch {
      // No body or invalid JSON - that's okay, folder_id is optional
    }

    // Get backend URL from environment
    const backendUrl = process.env.REFINER_BACKEND_URL || process.env.NEXT_PUBLIC_REFINER_BACKEND_URL
    if (!backendUrl) {
      console.error("REFINER_BACKEND_URL not configured")
      return NextResponse.json(
        {
          status: "error",
          doc_id: null,
          doc_url: null,
          title: null,
          warnings: ["backend_not_configured"],
          error: "Backend is not configured"
        },
        { status: 500 }
      )
    }

    // Build backend request URL
    let backendExportUrl = `${backendUrl}/jobs/${encodeURIComponent(jobId)}/export/google-doc`
    if (folderId) {
      backendExportUrl += `?folder_id=${encodeURIComponent(folderId)}`
    }

    console.log(`[Google Docs Export] Proxying request for job ${jobId} to backend:`, backendExportUrl)

    // Make request to backend
    const backendResponse = await fetch(backendExportUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      cache: "no-store",
    })

    const payload = await backendResponse.json().catch(() => null)

    if (!backendResponse.ok) {
      console.error(`[Google Docs Export] Backend returned error ${backendResponse.status}:`, payload)
      return NextResponse.json(
        payload || {
          status: "error",
          doc_id: null,
          doc_url: null,
          title: null,
          warnings: ["backend_export_failed"],
          error: "Backend export failed"
        },
        { status: backendResponse.status }
      )
    }

    console.log(`[Google Docs Export] Successfully exported job ${jobId} to Google Doc:`, payload?.doc_id)

    // Return structured response
    return NextResponse.json(payload)
  } catch (error) {
    console.error("[Google Docs Export] Unexpected error:", error)
    return NextResponse.json(
      {
        status: "error",
        doc_id: null,
        doc_url: null,
        title: null,
        warnings: ["unexpected_export_error"],
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
