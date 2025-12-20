"use client"

import { useState } from "react"
import { BarChart3, FileUp, AlertCircle, CheckCircle2, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Sidebar from "@/components/layout/sidebar"
import TopNav from "@/components/layout/top-nav"
import UploadPage from "@/components/pages/upload-page"
import ValidationProgressPage from "@/components/pages/validation-progress-page"
import ResultsDashboardPage from "@/components/pages/results-dashboard-page"
import ProviderDetailPage from "@/components/pages/provider-detail-page"
import ReportsPage from "@/components/pages/reports-page"
import DemoPage from "@/components/pages/demo-page"
import HistoryPage from "@/components/pages/history-page"
import { saveValidationJob, type ValidationJob } from "@/lib/storage"

export default function Valid8Care() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [processingFile, setProcessingFile] = useState<File | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleUploadStart = (file: File) => {
    setProcessingFile(file)
    setAnalysisResults(null) // Clear previous results
    setCurrentPage("progress")
  }

  const handleProcessingComplete = (results: any) => {
    setAnalysisResults(results)

    // Save to local storage
    if (processingFile && results) {
      const validatedProviders = results.validated_providers || []
      const total = validatedProviders.length
      const valid = validatedProviders.filter((p: any) => !p.requires_manual_review).length
      const avgConf = validatedProviders.reduce((sum: number, p: any) =>
        sum + (p.confidence_scores?.overall || 0), 0) / (total || 1)

      const job: ValidationJob = {
        jobId: `job_${Date.now()}`,
        timestamp: Date.now(),
        fileName: processingFile.name,
        fileSize: processingFile.size,
        status: 'completed',
        results: results,
        stats: {
          totalProviders: total,
          validCount: valid,
          invalidCount: total - valid,
          avgConfidence: avgConf
        }
      }

      saveValidationJob(job)
    }

    // Clear processing file to prevent re-trigger bug
    setProcessingFile(null)
    setCurrentPage("results")
  }

  const handleViewHistoryJob = (job: ValidationJob) => {
    setAnalysisResults(job.results)
    setCurrentPage("results")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav pageTitle={getPageTitle(currentPage)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background">
          {currentPage === "dashboard" && <DashboardPage setCurrentPage={setCurrentPage} />}
          {currentPage === "demo" && <DemoPage />}
          {currentPage === "upload" && <UploadPage onUploadStart={handleUploadStart} />}
          {currentPage === "progress" && processingFile && (
            <ValidationProgressPage
              processingFile={processingFile}
              onComplete={handleProcessingComplete}
            />
          )}
          {currentPage === "progress" && !processingFile && (
            <div className="p-4 max-w-2xl mx-auto mt-12">
              <Card className="stats-border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    <CardTitle>No Active Validation</CardTitle>
                  </div>
                  <CardDescription className="mt-2">
                    There is no validation job currently running. Upload a file to start a new validation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setCurrentPage("upload")} className="w-full">
                    <FileUp className="w-4 h-4 mr-2" />
                    Go to Upload Page
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {currentPage === "results" && (
            <ResultsDashboardPage
              analysisResults={analysisResults}
              onViewDetail={() => setCurrentPage("detail")}
            />
          )}
          {currentPage === "detail" && <ProviderDetailPage onBack={() => setCurrentPage("results")} />}
          {currentPage === "history" && <HistoryPage onViewResults={handleViewHistoryJob} />}
          {currentPage === "reports" && <ReportsPage />}
        </div>
      </div>
    </div>
  )
}

function DashboardPage({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const stats = [
    { label: "Total Providers", value: "12,543", change: "+2.4%", icon: CheckCircle2 },
    { label: "Validation Jobs", value: "156", change: "+12%", icon: Clock },
    { label: "Avg Confidence", value: "94.2%", change: "+1.8%", icon: BarChart3 },
    { label: "Issues Resolved", value: "2,341", change: "+8.2%", icon: AlertCircle },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Page Description */}
      <Card className="stats-border bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Dashboard Overview</CardTitle>
          </div>
          <CardDescription className="mt-2">
            Monitor your validation metrics and quickly access key features. Start a new validation or review recent activity.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="stats-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardDescription className="text-muted-foreground">{stat.label}</CardDescription>
                    <CardTitle className="text-2xl mt-2">{stat.value}</CardTitle>
                  </div>
                  <Icon className="w-5 h-5 text-primary mt-1" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-green-600 dark:text-green-400">{stat.change} from last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => setCurrentPage("upload")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Upload New File
            </Button>
            <Button
              onClick={() => setCurrentPage("results")}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              View Last Results
            </Button>
            <Button
              onClick={() => setCurrentPage("reports")}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 hours ago", action: "Validation completed", file: "providers_batch_23.csv" },
              { time: "5 hours ago", action: "File uploaded", file: "medical_staff_update.pdf" },
              { time: "1 day ago", action: "Report exported", file: "q4_accuracy_report.pdf" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 bg-muted/50 rounded border border-border"
              >
                <div>
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.file}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getPageTitle(page: string): string {
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    demo: "Demo",
    upload: "Upload File",
    progress: "Validation Progress",
    results: "Results Dashboard",
    detail: "Provider Details",
    history: "History",
    reports: "Reports",
  }
  return titles[page] || "Dashboard"
}
