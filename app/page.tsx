"use client"

import { useState } from "react"
import { BarChart3, FileUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Sidebar from "@/components/layout/sidebar"
import TopNav from "@/components/layout/top-nav"
import UploadPage from "@/components/pages/upload-page"
import ValidationProgressPage from "@/components/pages/validation-progress-page"
import ResultsDashboardPage from "@/components/pages/results-dashboard-page"
import ProviderDetailPage from "@/components/pages/provider-detail-page"
import ReportsPage from "@/components/pages/reports-page"

export default function Valid8Care() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav pageTitle={getPageTitle(currentPage)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {currentPage === "dashboard" && <DashboardPage setCurrentPage={setCurrentPage} />}
          {currentPage === "upload" && <UploadPage onSuccess={() => setCurrentPage("progress")} />}
          {currentPage === "progress" && <ValidationProgressPage onComplete={() => setCurrentPage("results")} />}
          {currentPage === "results" && <ResultsDashboardPage onViewDetail={() => setCurrentPage("detail")} />}
          {currentPage === "detail" && <ProviderDetailPage onBack={() => setCurrentPage("results")} />}
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
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="stats-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardDescription className="text-slate-400">{stat.label}</CardDescription>
                    <CardTitle className="text-2xl mt-2">{stat.value}</CardTitle>
                  </div>
                  <Icon className="w-5 h-5 text-cyan-400 mt-1" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-400">{stat.change} from last month</p>
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
              className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Upload New File
            </Button>
            <Button
              onClick={() => setCurrentPage("results")}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              View Last Results
            </Button>
            <Button
              onClick={() => setCurrentPage("reports")}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
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
                className="flex justify-between items-center p-3 bg-slate-800/30 rounded border border-slate-700"
              >
                <div>
                  <p className="text-sm text-slate-300">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.file}</p>
                </div>
                <span className="text-xs text-slate-400">{item.time}</span>
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
    upload: "Upload File",
    progress: "Validation Progress",
    results: "Results Dashboard",
    detail: "Provider Details",
    reports: "Reports",
  }
  return titles[page] || "Dashboard"
}
