"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"
import ProviderTable from "@/components/provider-table"
import { mockProviders } from "@/lib/mock-data"

interface ResultsDashboardPageProps {
  onViewDetail: () => void
}

export default function ResultsDashboardPage({ onViewDetail }: ResultsDashboardPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    confidence: "all",
    specialty: "all",
    location: "all",
  })

  const filteredProviders = useMemo(() => {
    return mockProviders.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.npi.includes(searchTerm) ||
        p.phone.includes(searchTerm)

      const matchesConfidence =
        filters.confidence === "all" ||
        (filters.confidence === "high" && p.confidence >= 90) ||
        (filters.confidence === "medium" && p.confidence >= 75 && p.confidence < 90) ||
        (filters.confidence === "low" && p.confidence < 75)

      const matchesSpecialty = filters.specialty === "all" || p.specialty === filters.specialty

      return matchesSearch && matchesConfidence && matchesSpecialty
    })
  }, [searchTerm, filters])

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Total Providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{mockProviders.length}</div>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>High Confidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {mockProviders.filter((p) => p.confidence >= 90).length}
            </div>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Avg Confidence Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              {(mockProviders.reduce((sum, p) => sum + p.confidence, 0) / mockProviders.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="stats-border">
          <CardHeader className="pb-3">
            <CardDescription>Issues Found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {mockProviders.filter((p) => p.issues.length > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="stats-border">
        <CardHeader>
          <CardTitle className="text-base">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, NPI, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-2">Confidence Level</label>
              <select
                value={filters.confidence}
                onChange={(e) => setFilters({ ...filters, confidence: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">All Confidence Levels</option>
                <option value="high">High (90%+)</option>
                <option value="medium">Medium (75-89%)</option>
                <option value="low">Low (&lt;75%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Specialty</label>
              <select
                value={filters.specialty}
                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200"
              >
                <option value="all">All Locations</option>
                <option value="NY">New York</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Table */}
      <ProviderTable providers={filteredProviders} onViewDetail={onViewDetail} />

      {/* Export Options */}
      <div className="flex gap-2">
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export as CSV
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
          Export as PDF
        </Button>
      </div>
    </div>
  )
}
