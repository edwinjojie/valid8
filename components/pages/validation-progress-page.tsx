"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Zap, TrendingUp, AlertCircle, Loader2 } from "lucide-react"

interface ValidationProgressPageProps {
  processingFile: File | null
  onComplete: (results: any) => void
}

export default function ValidationProgressPage({ processingFile, onComplete }: ValidationProgressPageProps) {
  const [overallProgress, setOverallProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const hasStarted = useRef(false)
  const jobIdRef = useRef<string | null>(null)

  const steps = [
    { id: "upload", name: "Upload received", icon: CheckCircle2 },
    { id: "ingestion", name: "Starting Ingestion (LLM cleaning)", icon: Zap },
    { id: "validation", name: "Starting Validation", icon: AlertCircle },
    { id: "finalizing", name: "Preparing final output", icon: Clock },
    { id: "finished", name: "Complete", icon: CheckCircle2 },
  ]

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => {
      // Avoid duplicate logs if polling hits same state multiple times
      if (prev.length > 0 && prev[prev.length - 1].includes(msg)) return prev
      return [...prev, `[${time}] ${msg}`]
    })
  }

  useEffect(() => {
    if (!processingFile || hasStarted.current) return
    hasStarted.current = true

    const startJob = async () => {
      addLog(`Initiating upload for file: ${processingFile.name}`)
      try {
        const formData = new FormData()
        formData.append("file", processingFile)

        const response = await fetch("http://localhost:8000/start-job", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Failed to start job: ${errText}`)
        }

        const data = await response.json()
        jobIdRef.current = data.job_id
        addLog(`Job started with ID: ${data.job_id}`)

        // Start Polling
        pollStatus(data.job_id)

      } catch (err: any) {
        setError(err.message || "Start failed")
        addLog(`Error: ${err.message}`)
      }
    }

    const pollStatus = async (jobId: string) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/status/${jobId}`)
          if (!res.ok) throw new Error("Status check failed")

          const statusData = await res.json()

          // update UI based on real backend state
          setOverallProgress(statusData.progress)

          // Logging state changes based on stage
          if (statusData.stage === 'ingestion') addLog("Ingestion Service: Cleaning data...")
          if (statusData.stage === 'validation') addLog("Validation Service: Checking NPI registry...")
          if (statusData.stage === 'finalizing') addLog("Aggregating results...")

          if (statusData.status === 'failed') {
            clearInterval(interval)
            setError(statusData.error || "Job failed")
            addLog(`Error: ${statusData.error}`)
          }

          if (statusData.status === 'completed') {
            clearInterval(interval)
            addLog("Process complete successfully.")
            // Short delay to show 100%
            setTimeout(() => {
              onComplete(statusData.result)
            }, 800)
          }

        } catch (err) {
          console.error("Polling error", err)
        }
      }, 1000)
    }

    startJob()
  }, [processingFile, onComplete])


  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Overall Progress */}
      <Card className="stats-border border-primary/20 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
          <CardDescription>
            {error ? (
              <span className="text-red-500">Processing Failed</span>
            ) : overallProgress === 100 ? (
              <span className="text-green-600 font-medium">Validation Complete!</span>
            ) : (
              <span className="flex items-center gap-2 text-primary font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing data... {overallProgress}%
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="text-lg font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-secondary" />
          </div>
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded border border-destructive/20">
              {error}
              <div className="mt-2">
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step-by-Step Status */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Live Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-2">
            {steps.map((step, i) => {
              // Map backend stage to UI steps
              // active / complete logic based on overall progress (which is now strictly controlled by backend)

              let isComplete = false
              let isCurrent = false

              if (overallProgress === 100) {
                isComplete = true
              } else {
                // Manual mapping based on backend progress checkpoints
                if (step.id === 'upload') isComplete = overallProgress >= 10
                if (step.id === 'ingestion') {
                  isComplete = overallProgress >= 50
                  isCurrent = overallProgress >= 10 && overallProgress < 50
                }
                if (step.id === 'validation') {
                  isComplete = overallProgress >= 90
                  isCurrent = overallProgress >= 50 && overallProgress < 90
                }
                if (step.id === 'finalizing') {
                  isComplete = overallProgress === 100
                  isCurrent = overallProgress >= 90 && overallProgress < 100
                }
              }

              let statusColor = "bg-background border-muted"
              let textColor = "text-muted-foreground"

              if (isComplete) {
                statusColor = "bg-green-500 border-green-500"
                textColor = "text-foreground"
              } else if (isCurrent && !error) {
                statusColor = "bg-primary border-primary animate-pulse"
                textColor = "text-foreground font-medium"
              }

              return (
                <div key={i} className="relative flex items-center pl-6">
                  <div
                    className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${statusColor} transition-colors duration-500`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${textColor} transition-colors duration-300`}>
                        {step.name}
                      </span>
                      {isCurrent && !error && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Logs */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/90 text-green-400 rounded border border-border p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto shadow-inner">
            {logs.length === 0 && <span className="text-gray-500 opacity-50">Waiting for logs...</span>}
            {logs.map((log, i) => (
              <div key={i} className="break-all border-b border-white/5 pb-0.5 mb-0.5 last:border-0">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
