"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Zap, TrendingUp, AlertCircle } from "lucide-react"

interface ValidationProgressPageProps {
  onComplete: () => void
}

export default function ValidationProgressPage({ onComplete }: ValidationProgressPageProps) {
  const [overallProgress, setOverallProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([
    "[14:23:45] Starting validation pipeline...",
    "[14:23:46] Loaded 1,245 provider records",
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (overallProgress >= 100) {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, "[14:28:30] Validation complete!", "[14:28:30] Click below to view results"])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [overallProgress])

  const steps = [
    { name: "OCR Extraction", icon: Zap, progress: overallProgress > 15 ? 100 : (overallProgress / 15) * 100 },
    {
      name: "NPI Validation",
      icon: CheckCircle2,
      progress: overallProgress > 35 ? 100 : Math.max(0, ((overallProgress - 15) / 20) * 100),
    },
    {
      name: "Address Verification",
      icon: TrendingUp,
      progress: overallProgress > 55 ? 100 : Math.max(0, ((overallProgress - 35) / 20) * 100),
    },
    {
      name: "Enrichment & Scoring",
      icon: AlertCircle,
      progress: overallProgress > 85 ? 100 : Math.max(0, ((overallProgress - 55) / 30) * 100),
    },
    {
      name: "Report Generation",
      icon: Clock,
      progress: overallProgress > 100 ? 100 : Math.max(0, ((overallProgress - 85) / 15) * 100),
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Overall Progress */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>12,543 providers being processed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-300">Completion</span>
              <span className="text-lg font-bold text-cyan-400">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-slate-800" />
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Status */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Validation Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isComplete = step.progress >= 100
            const isActive = step.progress > 0 && step.progress < 100

            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isComplete ? "text-emerald-400" : isActive ? "text-cyan-400 animate-spin" : "text-slate-600"
                      }`}
                    />
                    <span className={`text-sm font-medium ${isComplete ? "text-emerald-400" : "text-slate-300"}`}>
                      {step.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{Math.round(step.progress)}%</span>
                </div>
                <Progress value={step.progress} className="h-1.5 bg-slate-800" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Agent Logs */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Agent Reasoning Log</CardTitle>
          <CardDescription>Real-time validation pipeline output</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 rounded border border-slate-700 p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-400">
                <span className="text-cyan-400">{log.substring(0, 10)}</span>
                <span> {log.substring(10)}</span>
              </div>
            ))}
            {overallProgress < 100 && (
              <div className="text-slate-500">
                <span className="inline-block w-2 h-4 bg-slate-500 animate-pulse ml-1"></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      {overallProgress >= 100 && (
        <div className="flex gap-3">
          <Button onClick={onComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
            View Results
          </Button>
          <Button
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 flex-1 bg-transparent"
          >
            Download Log
          </Button>
        </div>
      )}
    </div>
  )
}
