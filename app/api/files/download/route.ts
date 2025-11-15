import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let filePath = searchParams.get("path")

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      )
    }

    // Normalize Windows backslashes to forward slashes
    filePath = filePath.replace(/\\/g, '/')

    // Security: resolve the path to prevent directory traversal
    const projectRoot = process.cwd()
    const repoRoot = path.resolve(projectRoot, "..")
    const backendOutputDir = path.join(repoRoot, 'backend', 'data', 'output')
    
    let resolvedPath: string
    
    // Handle relative paths like ./output/filename.docx or output\filename.docx
    if (filePath.startsWith('./output/') || filePath.startsWith('output/') || filePath.startsWith('./output\\') || filePath.startsWith('output\\')) {
      // Extract just the filename
      const fileName = path.basename(filePath)
      // Try backend/data/output first (preferred location)
      const preferredPath = path.join(backendOutputDir, fileName)
      if (fs.existsSync(preferredPath)) {
        resolvedPath = preferredPath
      } else {
        // Fallback to legacy backend/output directory
        const legacyOutputDir = path.join(repoRoot, 'backend', 'output')
        const legacyPath = path.join(legacyOutputDir, fileName)
        if (fs.existsSync(legacyPath)) {
          resolvedPath = legacyPath
        } else {
          // Default to preferred location
          resolvedPath = preferredPath
        }
      }
    } else if (path.isAbsolute(filePath)) {
      // Use absolute path as-is
      resolvedPath = filePath
    } else {
      // Try resolving relative to project root first
      resolvedPath = path.resolve(projectRoot, filePath)
    }
    
    // Normalize the resolved path (handle .. and .)
    resolvedPath = path.normalize(resolvedPath)
    
    // Allowlist of base directories
    const legacyOutputDir = path.join(repoRoot, 'backend', 'output')
    const allowList = [
      projectRoot,
      repoRoot,                                  // repo root (parent of Frontend)
      backendOutputDir,                          // backend/data/output (preferred)
      legacyOutputDir,                           // backend/output (legacy)
      path.join(repoRoot, 'output'),             // root output (for backward compatibility)
      '/var/folders',                            // macOS temp
      '/private/var/folders',                    // macOS temp (prefixed path)
      '/tmp',                                    // generic temp
      'C:\\Users',                               // Windows temp (for development)
    ]
    
    // Check if resolved path is within an allowed directory
    const isAllowed = allowList.some(base => {
      const normalizedBase = path.normalize(base)
      return resolvedPath.startsWith(normalizedBase) || 
             resolvedPath.toLowerCase().startsWith(normalizedBase.toLowerCase())
    })
    
    if (!isAllowed) {
      console.error(`Access denied for path: ${resolvedPath}. Allowed bases:`, allowList)
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(`File not found: ${resolvedPath}`)
      console.error(`Original path: ${filePath}`)
      console.error(`Backend output dir: ${backendOutputDir}`)
      console.error(`Backend output dir exists: ${fs.existsSync(backendOutputDir)}`)
      if (fs.existsSync(backendOutputDir)) {
        console.error(`Files in backend output dir:`, fs.readdirSync(backendOutputDir))
      }
      return NextResponse.json(
        { error: `File not found: ${path.basename(resolvedPath)}` },
        { status: 404 }
      )
    }

    // Read the file
    const fileBuffer = fs.readFileSync(resolvedPath)
    const fileName = path.basename(resolvedPath)
    const ext = path.extname(fileName).toLowerCase()
    
    // Determine content type
    const contentType =
      ext === '.txt' ? 'text/plain; charset=utf-8' :
      ext === '.md' ? 'text/markdown; charset=utf-8' :
      ext === '.json' ? 'application/json; charset=utf-8' :
      ext === '.pdf' ? 'application/pdf' :
      ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
      'application/octet-stream'

    // Encode filename for Content-Disposition header (RFC 5987)
    // Use both standard and UTF-8 encoded versions for maximum compatibility
    const encodedFileName = encodeURIComponent(fileName)
    // Force download by using 'attachment' and ensuring filename is properly quoted
    const contentDisposition = `attachment; filename="${fileName.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedFileName}`

    // Return the file as a download with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        // Prevent browser from displaying the file inline
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("File download error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download file" },
      { status: 500 }
    )
  }
}

