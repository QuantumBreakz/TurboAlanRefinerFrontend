"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, FileText, Upload, Download } from "lucide-react"
import { formatFilePath } from "@/lib/path-utils"

interface FileBrowserProps {
  onFileSelect: (filePath: string) => void
  selectedInputPath?: string
}

export default function FileBrowser({ 
  onFileSelect, 
  selectedInputPath
}: FileBrowserProps) {
  const [inputPath, setInputPath] = useState(selectedInputPath || "")
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Sync with selectedInputPath prop changes
  useEffect(() => {
    if (selectedInputPath && selectedInputPath !== inputPath) {
      setInputPath(selectedInputPath)
    }
  }, [selectedInputPath, inputPath])

  // Load available files from backend
  const loadAvailableFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/files')
      if (response.ok) {
        const data = await response.json()
        setAvailableFiles(data.files?.map((f: any) => f.filename) || [])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAvailableFiles()
  }, [])

  const handleInputPathChange = (path: string) => {
    setInputPath(path)
    onFileSelect(path)
  }


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_id', `upload_${Date.now()}`)

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const filePath = result.temp_path || result.file_path || result.filename
        // Store the actual path for backend, but display sanitized version
        setInputPath(filePath)
        onFileSelect(filePath)
        await loadAvailableFiles() // Refresh file list
      } else {
        alert('File upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const browseInputFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.docx,.doc,.pdf,.md'
    input.style.display = 'none'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Upload the file and use the temp path
        handleFileUpload({ target: { files: [file] } } as any)
      }
    }
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }


  const downloadProcessedFile = async () => {
    if (!inputPath) {
      alert('Please select a file first')
      return
    }

    try {
      // Trigger download of the processed file (use files/download route)
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(inputPath)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `processed_${inputPath.split('/').pop() || 'file'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Input File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Input File
          </CardTitle>
          <CardDescription>Select the file to process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>File Path</Label>
            <div className="flex gap-2">
              <Input
                value={inputPath}
                onChange={(e) => handleInputPathChange(e.target.value)}
                placeholder="Enter file path or upload a file"
                className="flex-1"
              />
              <Button onClick={browseInputFile} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </div>

          {/* Available Files */}
          {availableFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Available Files</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableFiles.map((filename, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <span className="text-sm">{filename}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputPathChange(filename)}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inputPath && (
            <div className="p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-700">
                  Selected
                </Badge>
                <span className="text-sm text-green-700" title={inputPath}>
                  {formatFilePath(inputPath, "Selected file")}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Section */}
      {inputPath && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to Download</h3>
                <p className="text-sm text-gray-600">Download your processed file</p>
              </div>
              <Button onClick={downloadProcessedFile} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
