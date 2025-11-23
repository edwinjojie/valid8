"use client"

import { Download, TrendingUp, TrendingDown } from "lucide-react"
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
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="stats-border">
            <CardHeader className="pb-3">
              <CardDescription>{metric.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-cyan-400">{metric.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${metric.positive ? "text-emerald-400" : "text-red-400"}`}
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
              <div key={i} className="p-4 bg-slate-800/30 rounded border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-100">{report.name}</h4>
                    <p className="text-xs text-slate-500">{report.date}</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">{report.records} providers</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-900/50 rounded">
                    <p className="text-xs text-slate-500 mb-1">High Confidence</p>
                    <p className="text-sm font-bold text-emerald-400">{report.highConfidence}</p>
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Medium Confidence</p>
                    <p className="text-sm font-bold text-amber-400">{report.mediumConfidence}</p>
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded">
                    <p className="text-xs text-slate-500 mb-1">Low Confidence</p>
                    <p className="text-sm font-bold text-red-400">{report.lowConfidence}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
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
                <span className="text-sm text-slate-300">High Confidence (90-100%)</span>
                <span className="text-sm font-bold text-emerald-400">89.9%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "89.9%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Medium Confidence (75-89%)</span>
                <span className="text-sm font-bold text-amber-400">8.9%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "8.9%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Low Confidence (&lt;75%)</span>
                <span className="text-sm font-bold text-red-400">1.2%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: "1.2%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <div className="flex gap-2">
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 flex-1 bg-transparent">
          Schedule Report
        </Button>
      </div>
    </div>
  )
}
