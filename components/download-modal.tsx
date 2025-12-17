"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface DownloadOption {
  fileId: string
  fileName: string
  fileExtension?: string  // Original file extension (docx, doc, txt, etc.)
  passes: { passNumber: number; path: string; size?: number; textContent?: string }[]
}

interface DownloadModalProps {
  open: boolean
  onClose: () => void
  downloadOptions: DownloadOption[]
}

export default function DownloadModal({ open, onClose, downloadOptions }: DownloadModalProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedPass, setSelectedPass] = useState<number | null>(null)

  const handleDownload = async () => {
    if (!selectedFile || selectedPass === null) {
      alert("Please select both a file and a pass")
      return
    }

    const option = downloadOptions.find(opt => opt.fileId === selectedFile)
    const passData = option?.passes.find(p => p.passNumber === selectedPass)

    if (!passData) {
      alert("Could not find the selected file/pass")
      return
    }

    try {
      // CRITICAL FIX: Determine the correct file extension
      // Priority: 1) From path, 2) From option.fileExtension, 3) Default to .txt
      const getFileExtension = () => {
        if (passData.path) {
          const pathExt = passData.path.split('.').pop()?.toLowerCase()
          if (pathExt && ['docx', 'doc', 'pdf', 'txt', 'md'].includes(pathExt)) {
            return `.${pathExt}`
          }
        }
        if (option?.fileExtension) {
          return option.fileExtension.startsWith('.') ? option.fileExtension : `.${option.fileExtension}`
        }
        // Extract from original filename if possible
        const origExt = option?.fileName?.split('.').pop()?.toLowerCase()
        if (origExt && ['docx', 'doc', 'pdf', 'txt', 'md'].includes(origExt)) {
          return `.${origExt}`
        }
        return '.txt'  // Default fallback
      }
      
      const fileExtension = getFileExtension()
      const baseFileName = option?.fileName?.replace(/\.[^/.]+$/, '') || 'download'  // Remove existing extension
      const downloadFileName = `${baseFileName}_pass${selectedPass}${fileExtension}`
      
      // CRITICAL FIX: Use textContent first (reliable on Vercel), then fall back to path-based download
      if (passData.textContent) {
        // Client-side download using textContent (works on Vercel)
        // IMPORTANT: textContent is always plain text - use .txt extension to avoid confusing users
        // who might expect a .docx to open in Word. The path-based download below will use the
        // actual file format if available.
        const textDownloadFileName = `${baseFileName}_pass${selectedPass}.txt`
        const blob = new Blob([passData.textContent], { type: 'text/plain;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = textDownloadFileName
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 100)
        onClose()
        return
      }

      // Fallback to path-based download if textContent not available
      if (!passData.path) {
        throw new Error("No file content or path available for download")
      }

      const response = await fetch(`/api/files/download?path=${encodeURIComponent(passData.path)}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        // If file not found and we have textContent, use it (shouldn't happen but safety check)
        if (response.status === 404 && passData.textContent) {
          // Use .txt extension for textContent (plain text) to avoid confusing users
          const textFallbackFileName = `${baseFileName}_pass${selectedPass}.txt`
          const blob = new Blob([passData.textContent], { type: 'text/plain;charset=utf-8' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = textFallbackFileName
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          }, 100)
          onClose()
          return
        }
        throw new Error(`Download failed: ${errorText || response.statusText}`)
      }

      // Get the blob
      const blob = await response.blob()
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      // Close modal after successful download
      onClose()
    } catch (error) {
      console.error("Download error:", error)
      alert(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`)
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={!selectedFile || selectedPass === null}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

