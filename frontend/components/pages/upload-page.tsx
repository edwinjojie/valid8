"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, File, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UploadPageProps {
  onUploadStart: (file: File) => void
}

export default function UploadPage({ onUploadStart }: UploadPageProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    // Only take the first file if multiple
    if (droppedFiles.length > 0) {
      setFiles([droppedFiles[0]])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([e.target.files[0]])
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Upload Zone */}
      <Card className="border-2 border-dashed stats-border">
        <CardContent className="p-0">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-12 text-center transition-colors ${dragActive ? "bg-primary/10 border-primary" : ""}`}
          >
            <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Drop CSV file here</h3>
            <p className="text-sm text-muted-foreground mb-4">Supports CSV files for provider validation</p>
            <Button
              onClick={handleBrowseClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".csv"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="stats-border">
          <CardHeader>
            <CardTitle className="text-base">File to Upload</CardTitle>
            <CardDescription>Ready to process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="stats-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            What happens next
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Files will be processed through our validation pipeline:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>AI-powered Cleaning & Normalization</li>
            <li>NPI Database Verification</li>
            <li>Confidence Scoring</li>
            <li>Discrepancy Detection</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => files.length > 0 && onUploadStart(files[0])}
          disabled={files.length === 0}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Upload Provider Dataset
        </Button>
      </div>
    </div>
  )
}
