"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, Cloud, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { refinerClient } from "@/lib/refiner-client"

interface DownloadOption {
  fileId: string
  fileName: string
  fileExtension?: string  // Original file extension (docx, doc, txt, etc.)
  passes: { passNumber: number; path: string; size?: number; textContent?: string }[]
}

interface DownloadModalProps {
  open: boolean
  onClose: () => void
  jobId: string | null
  downloadOptions: DownloadOption[]
}

export default function DownloadModal({ open, onClose, jobId, downloadOptions }: DownloadModalProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedPass, setSelectedPass] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExportingToGoogleDocs, setIsExportingToGoogleDocs] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error" | null
    message: string
    docUrl?: string
  }>({ type: null, message: "" })
  const urlRefs = useRef<string[]>([])
  const downloadOptionsRef = useRef(downloadOptions)

  // Update ref when downloadOptions changes to avoid stale closure
  useEffect(() => {
    downloadOptionsRef.current = downloadOptions
  }, [downloadOptions])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      urlRefs.current.forEach(url => {
        try {
          window.URL.revokeObjectURL(url)
        } catch (e) {
          // Ignore errors during cleanup
        }
      })
      urlRefs.current = []
    }
  }, [])

  const handleDownload = async () => {
    if (!selectedFile || selectedPass === null) {
      alert("Please select both a file and a pass")
      return
    }

    if (!jobId) {
      alert("No active job found for download")
      return
    }

    // Use ref to avoid stale closure
    const option = downloadOptionsRef.current.find(opt => opt.fileId === selectedFile)
    const passData = option?.passes.find(p => p.passNumber === selectedPass)

    if (!passData) {
      alert("Could not find the selected file/pass")
      return
    }

    setIsDownloading(true)
    setExportStatus({ type: null, message: "" })

    try {
      // Call backend export API via Next proxy to enforce same-format contract
      const exportResponse = await fetch(
        `/api/jobs/${encodeURIComponent(jobId)}/export_pass` +
        `?file_id=${encodeURIComponent(option.fileId)}` +
        `&pass=${encodeURIComponent(String(selectedPass))}` +
        `&format=same`
      )

      if (!exportResponse.ok) {
        const errorPayload = await exportResponse.json().catch(() => null)
        const message =
          (errorPayload && (errorPayload.error || errorPayload.message)) ||
          "Export failed"
        throw new Error(message)
      }

      const exportPayload = await exportResponse.json() as {
        status: string
        format: string | null
        download_url: string | null
        file_content?: string  // Base64 encoded file content (Vercel/serverless)
        filename?: string      // Filename for serverless mode
        warnings?: string[]
      }

      if (exportPayload.status !== "success" && exportPayload.status !== "partial_success") {
        throw new Error("Export failed with status: " + exportPayload.status)
      }

      // HYBRID APPROACH: Handle both Vercel (serverless) and traditional deployments
      let filename = ""
      let downloadUrl = ""

      if (exportPayload.file_content && exportPayload.filename) {
        // Serverless mode: File content included directly as base64
        filename = exportPayload.filename
        
        // Decode base64 and create blob URL for download
        try {
          const binaryString = atob(exportPayload.file_content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes])
          downloadUrl = URL.createObjectURL(blob)
        } catch (e) {
          throw new Error("Failed to decode file content from serverless response")
        }
      } else if (exportPayload.download_url) {
        // Traditional mode: Download via URL
        downloadUrl = exportPayload.download_url
        
        // Extract filename from backend download_url (/files/serve?filename=...)
        try {
          const urlObj = new URL(exportPayload.download_url, window.location.origin)
          filename = urlObj.searchParams.get("filename") || ""
        } catch {
          const parts = exportPayload.download_url.split("filename=")
          if (parts.length > 1) {
            filename = decodeURIComponent(parts[1])
          }
        }

        if (!filename) {
          throw new Error("Invalid download URL returned from export")
        }
      } else {
        throw new Error("Export did not return a downloadable file (no URL or content)")
      }

      // Download actual file
      let finalDownloadUrl = ""
      
      if (exportPayload.file_content) {
        // Serverless mode: We already have the blob URL from decoded base64
        finalDownloadUrl = downloadUrl
        urlRefs.current.push(finalDownloadUrl)
      } else {
        // Traditional mode: Fetch via Next.js proxy (handles headers, content type, etc.)
        const fileResponse = await fetch(`/api/files/download?path=${encodeURIComponent(filename)}`)
        if (!fileResponse.ok) {
          const errorText = await fileResponse.text()
          throw new Error(errorText || fileResponse.statusText || "File download failed")
        }

        const blob = await fileResponse.blob()
        finalDownloadUrl = window.URL.createObjectURL(blob)
        urlRefs.current.push(finalDownloadUrl)
      }

      const a = document.createElement('a')
      a.href = finalDownloadUrl
      a.download = filename  // Set filename for download
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      try {
        window.URL.revokeObjectURL(finalDownloadUrl)
        const index = urlRefs.current.indexOf(finalDownloadUrl)
        if (index > -1) urlRefs.current.splice(index, 1)
      } catch {
        // Ignore cleanup errors
      }

      onClose()
    } catch (error) {
      console.error("Download error:", error)
      alert(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleExportToGoogleDocs = async () => {
    if (!jobId) {
      setExportStatus({ type: "error", message: "No active job found" })
      return
    }

    setIsExportingToGoogleDocs(true)
    setExportStatus({ type: null, message: "" })

    try {
      console.log(`[Google Docs Export] Starting export for job ${jobId}`)
      
      const result = await refinerClient.exportToGoogleDocs(jobId)
      
      if (result.status === "success" || result.status === "partial_success") {
        console.log(`[Google Docs Export] Success! Doc ID: ${result.doc_id}`)
        
        const warningMessage = result.warnings.length > 0 
          ? ` (with warnings: ${result.warnings.join(", ")})`
          : ""
        
        setExportStatus({
          type: "success",
          message: `Successfully exported to Google Docs${warningMessage}`,
          docUrl: result.doc_url || undefined
        })

        // Auto-open the Google Doc in a new tab
        if (result.doc_url) {
          setTimeout(() => {
            window.open(result.doc_url!, "_blank", "noopener,noreferrer")
          }, 500)
        }

        // Auto-close the modal after a short delay to show success message
        setTimeout(() => {
          onClose()
        }, 2500)
      } else {
        console.error(`[Google Docs Export] Failed:`, result)
        const errorMessage = result.error || "Export failed"
        const warningDetails = result.warnings.length > 0 
          ? ` (${result.warnings.join(", ")})` 
          : ""
        
        setExportStatus({
          type: "error",
          message: `${errorMessage}${warningDetails}`
        })
      }
    } catch (error) {
      console.error("[Google Docs Export] Unexpected error:", error)
      setExportStatus({
        type: "error",
        message: `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
      })
    } finally {
      setIsExportingToGoogleDocs(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Download Refined Files</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a file and pass to download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {downloadOptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No processed files available for download
            </div>
          ) : (
            <>
              {/* File Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Select File</label>
                <div className="grid gap-2">
                  {downloadOptions.map((option) => (
                    <button
                      key={option.fileId}
                      onClick={() => {
                        setSelectedFile(option.fileId)
                        setSelectedPass(null) // Reset pass selection
                      }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedFile === option.fileId
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{option.fileName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {option.passes.length} {option.passes.length === 1 ? 'pass' : 'passes'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pass Selection */}
              {selectedFile && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground">Select Pass</label>
                  <div className="grid grid-cols-3 gap-2">
                    {downloadOptions
                      .find(opt => opt.fileId === selectedFile)
                      ?.passes.map((pass) => (
                        <button
                          key={pass.passNumber}
                          onClick={() => setSelectedPass(pass.passNumber)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            selectedPass === pass.passNumber
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="text-sm font-semibold text-foreground">Pass {pass.passNumber}</div>
                          {pass.size && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {(pass.size / 1024).toFixed(1)} KB
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Export Status Banner */}
        {exportStatus.type && (
          <div className={`p-3 rounded-lg border flex items-start gap-2 ${
            exportStatus.type === "success" 
              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
          }`}>
            {exportStatus.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                exportStatus.type === "success"
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}>
                {exportStatus.message}
              </p>
              {exportStatus.docUrl && (
                <a
                  href={exportStatus.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 dark:text-green-300 hover:underline mt-1 inline-block"
                >
                  Open in Google Docs →
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading || isExportingToGoogleDocs}>
            Cancel
          </Button>
          <Button 
            onClick={handleExportToGoogleDocs}
            disabled={!jobId || isDownloading || isExportingToGoogleDocs}
            variant="outline"
            className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            {isExportingToGoogleDocs ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Save to Google Docs
              </>
            )}
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={!selectedFile || selectedPass === null || isDownloading || isExportingToGoogleDocs}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

