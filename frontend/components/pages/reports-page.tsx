"use client"

import { Download, TrendingUp, TrendingDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
  const metrics = [
    { label: "Directory Accuracy", value: "94.2%", change: "+2.1%", positive: true },
    { label: "Total Providers", value: "12,543", change: "+5.4%", positive: true },
    { label: "High Confidence", value: "11,267", change: "+3.2%", positive: true },
    { label: "Issues Found", value: "1,276", change: "-1.8%", positive: true },
  ]

  const reports = [
    {
      name: "Q4 2024 Accuracy Report",
      date: "2024-12-15",
      records: 12543,
      highConfidence: 11267,
      mediumConfidence: 1122,
      lowConfidence: 154,
    },
    {
      name: "November Provider Update",
      date: "2024-11-30",
      records: 12201,
      highConfidence: 11089,
      mediumConfidence: 987,
      lowConfidence: 125,
    },
    {
      name: "October Batch Processing",
      date: "2024-10-31",
      records: 11956,
      highConfidence: 10834,
      mediumConfidence: 1034,
      lowConfidence: 88,
    },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Page Description */}
      <Card className="stats-border bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Reports & Analytics</CardTitle>
          </div>
          <CardDescription className="mt-2">
            Generate comprehensive reports, track validation metrics over time, and export data for compliance and analysis.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="stats-border">
            <CardHeader className="pb-3">
              <CardDescription>{metric.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-primary">{metric.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${metric.positive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
                >
                  {metric.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Summary */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle>Validation Reports</CardTitle>
          <CardDescription>Historical batch processing results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{report.name}</h4>
                    <p className="text-xs text-muted-foreground">{report.date}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{report.records} providers</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-background rounded">
                    <p className="text-xs text-muted-foreground mb-1">High Confidence</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{report.highConfidence}</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-xs text-muted-foreground mb-1">Medium Confidence</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{report.mediumConfidence}</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-xs text-muted-foreground mb-1">Low Confidence</p>
                    <p className="text-sm font-bold text-destructive">{report.lowConfidence}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-input text-foreground hover:bg-muted bg-transparent"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-input text-foreground hover:bg-muted bg-transparent"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Distribution Chart Description */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Confidence Distribution</CardTitle>
          <CardDescription>Current validation batch breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">High Confidence (90-100%)</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">89.9%</span>
              </div>
              <div className="h-2 bg-secondary rounded overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "89.9%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Medium Confidence (75-89%)</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">8.9%</span>
              </div>
              <div className="h-2 bg-secondary rounded overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "8.9%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Low Confidence (&lt;75%)</span>
                <span className="text-sm font-bold text-destructive">1.2%</span>
              </div>
              <div className="h-2 bg-secondary rounded overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: "1.2%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <div className="flex gap-2">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report
        </Button>
        <Button variant="outline" className="border-input text-foreground hover:bg-muted flex-1 bg-transparent">
          Schedule Report
        </Button>
      </div>
    </div>
  )
}
