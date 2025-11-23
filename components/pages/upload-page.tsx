"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UploadPageProps {
  onSuccess: () => void
}

export default function UploadPage({ onSuccess }: UploadPageProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Upload Zone */}
      <Card className="border-2 border-dashed stats-border">
        <CardContent className="p-0">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-12 text-center transition-colors ${dragActive ? "bg-cyan-500/10 border-cyan-500" : ""}`}
          >
            <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Drop files here to upload</h3>
            <p className="text-sm text-slate-400 mb-4">Supports CSV, PDF, and image files (JPG, PNG, TIFF)</p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Browse Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="stats-border">
          <CardHeader>
            <CardTitle className="text-base">Files to Upload</CardTitle>
            <CardDescription>{files.length} file(s) selected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded border border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="stats-border bg-slate-800/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            What happens next
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-300">Files will be processed through our validation pipeline:</p>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>OCR extraction (PDFs & images)</li>
            <li>NPI validation against CMS database</li>
            <li>Address verification via Google Maps</li>
            <li>License board cross-reference</li>
            <li>AI enrichment & confidence scoring</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onSuccess} disabled={files.length === 0} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          Start Validation
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
          Save Draft
        </Button>
      </div>
    </div>
  )
}
