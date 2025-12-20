"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, CheckCircle2, AlertTriangle, FileText, ExternalLink, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { downloadJSON, downloadCSV } from "@/lib/storage"

interface ResultsDashboardPageProps {
  analysisResults?: any
  onViewDetail: () => void
}

export default function ResultsDashboardPage({ analysisResults, onViewDetail }: ResultsDashboardPageProps) {
  // Use analysisResults if available, otherwise fallback to empty or mock
  const cleanedProviders = analysisResults?.cleaned_providers || []
  const validatedProviders = analysisResults?.validated_providers || []

  // Stats
  const total = validatedProviders.length
  const verified = validatedProviders.filter((p: any) => !p.requires_manual_review).length
  const reviewNeeded = total - verified

  const handleDownloadJSON = () => {
    downloadJSON(analysisResults, `validation_results_${Date.now()}.json`)
  }

  const handleDownloadCSV = () => {
    downloadCSV(cleanedProviders, `cleaned_providers_${Date.now()}.csv`)
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Page Description */}
      <Card className="stats-border bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Validation Results</CardTitle>
          </div>
          <CardDescription className="mt-2">
            Review AI-cleaned data, validation results, and discrepancies. Download reports or analyze individual providers.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stats-border bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Providers</CardDescription>
            <CardTitle className="text-3xl text-primary">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="stats-border bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Successfully Verified</CardDescription>
            <CardTitle className="text-3xl text-green-600">{verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="stats-border bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Requires Review</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{reviewNeeded}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="cleaned">Cleaned Data Preview</TabsTrigger>
          <TabsTrigger value="validation">Validation Results</TabsTrigger>
          <TabsTrigger value="report">Full Report</TabsTrigger>
        </TabsList>

        {/* Tab 1: Cleaned Data */}
        <TabsContent value="cleaned">
          <Card className="stats-border">
            <CardHeader>
              <CardTitle>AI-Cleaned Provider Data</CardTitle>
              <CardDescription>Data extracted and normalized from your CSV.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>NPI</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleanedProviders.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.name || "N/A"}</TableCell>
                      <TableCell>{p.specialty || "N/A"}</TableCell>
                      <TableCell>{p.npi_number || "MISSING"}</TableCell>
                      <TableCell>{p.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          High
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cleanedProviders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Validation Results */}
        <TabsContent value="validation">
          <Card className="stats-border">
            <CardHeader>
              <CardTitle>Validation & Risk Analysis</CardTitle>
              <CardDescription>Discrepancies found against NPI Registry.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validatedProviders.map((res: any, i: number) => {
                  // Attempt to reconstruct provider name from inputs or updates
                  const name = res.updated_fields?.name || "Unknown Provider"

                  const hasIssues = res.requires_manual_review
                  const issues = res.discrepancies || []
                  const score = res.confidence_scores?.overall || 0.0

                  return (
                    <div key={i} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{name}</h4>
                          {hasIssues ? (
                            <Badge variant="destructive" className="flex gap-1 items-center">
                              <AlertTriangle className="w-3 h-3" /> Risk Detected
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600 flex gap-1 items-center hover:bg-green-700">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {issues.length > 0 ? (
                            <ul className="list-disc list-inside text-red-500">
                              {issues.map((issue: any, k: number) => (
                                <li key={k}>
                                  {typeof issue === 'object' ? JSON.stringify(issue) : String(issue)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-green-600">No discrepancies found. All data matches registry.</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-sm font-medium">Confidence Score</div>
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${score > 0.8 ? "bg-green-500" : score > 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">{(score * 100).toFixed(0)}% Match</div>
                      </div>
                    </div>
                  )
                })}
                {validatedProviders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No validation results yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Report */}
        <TabsContent value="report">
          <Card className="stats-border">
            <CardHeader>
              <CardTitle>Download Final Report</CardTitle>
              <CardDescription>Export your validated data for internal use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-medium">Full Results (JSON)</h4>
                    <p className="text-xs text-muted-foreground">Complete validation data including all metadata.</p>
                  </div>
                </div>
                <Button onClick={handleDownloadJSON} disabled={!analysisResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="p-4 bg-muted/30 rounded border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Cleaned Data (CSV)</h4>
                    <p className="text-xs text-muted-foreground">AI-cleaned provider data ready for import.</p>
                  </div>
                </div>
                <Button onClick={handleDownloadCSV} disabled={!cleanedProviders || cleanedProviders.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Start New Validation</Button>
      </div>

    </div>
  )
}
