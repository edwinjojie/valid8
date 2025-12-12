"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, AlertTriangle, CheckCircle, FileText } from "lucide-react"
=======
=======
>>>>>>> Stashed changes
import { Download, CheckCircle2, AlertTriangle, FileText, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

interface ResultsDashboardPageProps {
  analysisResults?: any
  onViewDetail: () => void
  analysisResults?: any
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export default function ResultsDashboardPage({ onViewDetail, analysisResults }: ResultsDashboardPageProps) {
  if (!analysisResults) {
    return <div className="p-4">No results available. Please upload a file first.</div>
  }

  const { cleaned_providers, validated_providers, cleaned_count, validated_count } = analysisResults

  // Helper to get validation status for a provider index
  const getValidationStatus = (index: number) => {
    if (!validated_providers || !validated_providers[index]) return null
    return validated_providers[index]
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Validation Results</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Download Cleaned CSV
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" /> Download Final Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cleaned" className="space-y-4">
        <TabsList>
=======
export default function ResultsDashboardPage({ analysisResults, onViewDetail }: ResultsDashboardPageProps) {
  // Use analysisResults if available, otherwise fallback to empty or mock
  const cleanedProviders = analysisResults?.cleaned_providers || []
  const validatedProviders = analysisResults?.validated_providers || []

  // Stats
  const total = validatedProviders.length
  const verified = validatedProviders.filter((p: any) => !p.requires_manual_review).length
  const reviewNeeded = total - verified

  return (
=======
export default function ResultsDashboardPage({ analysisResults, onViewDetail }: ResultsDashboardPageProps) {
  // Use analysisResults if available, otherwise fallback to empty or mock
  const cleanedProviders = analysisResults?.cleaned_providers || []
  const validatedProviders = analysisResults?.validated_providers || []

  // Stats
  const total = validatedProviders.length
  const verified = validatedProviders.filter((p: any) => !p.requires_manual_review).length
  const reviewNeeded = total - verified

  return (
>>>>>>> Stashed changes
    <div className="p-4 space-y-4 max-w-6xl mx-auto">

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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          <TabsTrigger value="cleaned">Cleaned Data Preview</TabsTrigger>
          <TabsTrigger value="validation">Validation Results</TabsTrigger>
          <TabsTrigger value="report">Full Report</TabsTrigger>
        </TabsList>
<<<<<<< Updated upstream
<<<<<<< Updated upstream

        {/* TAB A: Cleaned Data Preview */}
        <TabsContent value="cleaned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cleaned Provider Data</CardTitle>
              <CardDescription>
                {cleaned_count} records processed and normalized by AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
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
                    {cleaned_providers?.map((provider: any, i: number) => (
                      <TableRow key={i} className="hover:bg-muted/50 cursor-pointer" onClick={onViewDetail}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>{provider.specialty}</TableCell>
                        <TableCell>{provider.npi_number}</TableCell>
                        <TableCell>{provider.phone}</TableCell>
                        <TableCell>
                          <Badge variant={provider.confidence?.name > 0.8 ? "default" : "secondary"}>
                            {Math.round((provider.confidence?.name || 0) * 100)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB B: Validation Results */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Discrepancies</CardTitle>
              <CardDescription>
                Review detected inconsistencies against external registries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validated_providers?.map((res: any, i: number) => {
                  const providerName = cleaned_providers?.[i]?.name || `Provider #${i + 1}`;
                  const hasDiscrepancies = res.discrepancies?.length > 0;

                  return (
                    <div key={i} className="border rounded-lg p-4 flex justify-between items-start bg-card">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{providerName}</h4>
                          {hasDiscrepancies ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" /> Risk Detected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </Badge>
                          )}
                        </div>

                        {hasDiscrepancies ? (
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {res.discrepancies.map((d: any, idx: number) => (
                              <li key={idx} className="text-red-500">{typeof d === 'string' ? d : JSON.stringify(d)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">All data points match validation sources.</p>
                        )}

                        {res.validation_notes?.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <strong>Notes:</strong> {res.validation_notes.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Confidence Score</div>
                        <div className="flex items-center gap-2 justify-end">
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            {/* Calculate simple average confidence from cleaned data as a proxy if not in validation result */}
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${(cleaned_providers?.[i]?.confidence?.npi_number || 0.8) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm">{Math.round((cleaned_providers?.[i]?.confidence?.npi_number || 0.8) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB C: Full Report */}
        <TabsContent value="report" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Providers</span>
                  <span className="font-bold">{cleaned_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Successfully Verified</span>
                  <span className="font-bold text-green-600">
                    {validated_providers?.filter((p: any) => !p.requires_manual_review).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requires Review</span>
                  <span className="font-bold text-amber-600">
                    {validated_providers?.filter((p: any) => p.requires_manual_review).length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Download Options</CardTitle>
                <CardDescription>Export your data for downstream processing</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded hover:bg-muted/50 transition-colors cursor-pointer text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold">Full Audit Report (PDF)</h3>
                  <p className="text-xs text-muted-foreground">Includes all discrepancies and AI reasoning logs.</p>
                </div>
                <div className="p-4 border rounded hover:bg-muted/50 transition-colors cursor-pointer text-center space-y-2">
                  <Table className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold">Cleaned Dataset (CSV)</h3>
                  <p className="text-xs text-muted-foreground">Normalized data ready for import.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
=======

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
                      <TableCell className="font-medium">{p.first_name || ""} {p.last_name || ""}</TableCell>
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
                  const name = res.updated_fields?.first_name
                    ? `${res.updated_fields.first_name} ${res.updated_fields.last_name}`
                    : "Unknown Provider"

=======

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
                      <TableCell className="font-medium">{p.first_name || ""} {p.last_name || ""}</TableCell>
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
                  const name = res.updated_fields?.first_name
                    ? `${res.updated_fields.first_name} ${res.updated_fields.last_name}`
                    : "Unknown Provider"

>>>>>>> Stashed changes
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
                              {issues.map((issue: string, k: number) => (
                                <li key={k}>{issue}</li>
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
                    <h4 className="font-medium">Summary Report (PDF)</h4>
                    <p className="text-xs text-muted-foreground">Includes charts and risk summaries.</p>
                  </div>
                </div>
                <Button variant="outline">Download</Button>
              </div>

              <div className="p-4 bg-muted/30 rounded border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Cleaned Data (CSV)</h4>
                    <p className="text-xs text-muted-foreground">Raw cleaned data ready for import.</p>
                  </div>
                </div>
                <Button>Download CSV</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Start New Validation</Button>
      </div>

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    </div>
  )
}
