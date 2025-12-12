"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, AlertTriangle, CheckCircle, FileText } from "lucide-react"

interface ResultsDashboardPageProps {
  onViewDetail: () => void
  analysisResults?: any
}

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
          <TabsTrigger value="cleaned">Cleaned Data Preview</TabsTrigger>
          <TabsTrigger value="validation">Validation Results</TabsTrigger>
          <TabsTrigger value="report">Full Report</TabsTrigger>
        </TabsList>

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
    </div>
  )
}
