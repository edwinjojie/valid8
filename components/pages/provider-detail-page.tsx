"use client"

import { ArrowLeft, CheckCircle2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProviderDetailPageProps {
  onBack: () => void
}

const sampleProvider = {
  id: "1",
  name: "Dr. Sarah Johnson",
  npi: "1234567890",
  phone: "(555) 123-4567",
  address: "123 Medical Center Dr, New York, NY 10001",
  specialty: "Cardiology",
  license: "NY-MD-045123",
  confidence: 95,
  validated: true,
  issues: [],
  original: {
    name: "Dr. Sarah Johnson",
    npi: "1234567890",
    phone: "(555) 123-4567",
    address: "123 Medical Center Dr, New York, NY 10001",
    specialty: "Cardiology",
    license: "NY-MD-045123",
  },
  validated_data: {
    name: "Dr. Sarah Johnson MD",
    npi: "1234567890",
    phone: "(555) 123-4567",
    address: "123 Medical Center Drive, New York, NY 10001-1234",
    specialty: "Cardiology - Invasive",
    license: "NY-MD-045123",
  },
  confidenceBreakdown: [
    { category: "NPI Validation", score: 100 },
    { category: "Address Verification", score: 98 },
    { category: "License Verification", score: 92 },
    { category: "Specialty Matching", score: 88 },
  ],
}

export default function ProviderDetailPage({ onBack }: ProviderDetailPageProps) {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-100">{sampleProvider.name}</h2>
          <p className="text-sm text-slate-500">NPI: {sampleProvider.npi}</p>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded font-medium inline-block ${"health-badge-high"}`}>
            {sampleProvider.confidence}% Confidence
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Validated</span>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Issues</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-emerald-400">0</span>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Last Updated</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-slate-300">2 hours ago</span>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Reviewed</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-slate-300">No</span>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Breakdown */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Confidence Breakdown</CardTitle>
          <CardDescription>Component scores by validation source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleProvider.confidenceBreakdown.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">{item.category}</span>
                <span className="text-sm font-bold text-cyan-400">{item.score}%</span>
              </div>
              <Progress value={item.score} className="h-2 bg-slate-800" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Original vs Validated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="stats-border">
          <CardHeader>
            <CardTitle className="text-base">Original Data</CardTitle>
            <CardDescription>As submitted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.entries(sampleProvider.original).map(([key, value]) => (
              <div key={key}>
                <p className="text-slate-400 text-xs mb-1 uppercase">{key}</p>
                <p className="text-slate-200">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="stats-border">
          <CardHeader>
            <CardTitle className="text-base">Validated Data</CardTitle>
            <CardDescription>After validation enrichment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.entries(sampleProvider.validated_data).map(([key, value]) => (
              <div key={key}>
                <p className="text-slate-400 text-xs mb-1 uppercase">{key}</p>
                <p className="text-emerald-300">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Source Map */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Validation Sources</CardTitle>
          <CardDescription>Where data was verified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { source: "CMS NPI Database", status: "✓ Verified" },
              { source: "Google Maps", status: "✓ Verified" },
              { source: "State License Board", status: "✓ Verified" },
              { source: "PECOS Registry", status: "✓ Verified" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-2 bg-slate-800/30 rounded border border-slate-700"
              >
                <span className="text-sm text-slate-300">{item.source}</span>
                <span className="text-xs text-emerald-400">{item.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delta Log */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Changes Applied</CardTitle>
          <CardDescription>Modifications during validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { field: "Address", from: "123 Medical Center Dr", to: "123 Medical Center Drive" },
              { field: "Specialty", from: "Cardiology", to: "Cardiology - Invasive" },
              { field: "Name", from: "Dr. Sarah Johnson", to: "Dr. Sarah Johnson MD" },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-slate-800/30 rounded border border-slate-700 space-y-1">
                <p className="font-medium text-slate-200">{item.field}</p>
                <p className="text-slate-400">
                  <span className="line-through">{item.from}</span> → <span className="text-cyan-400">{item.to}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Edit & Review */}
      <div className="flex gap-3">
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1">
          <TrendingUp className="w-4 h-4 mr-2" />
          Mark as Reviewed
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 flex-1 bg-transparent">
          Edit Manually
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 flex-1 bg-transparent">
          Flag for Review
        </Button>
      </div>
    </div>
  )
}
