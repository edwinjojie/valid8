"use client"

import { AlertCircle, CheckCircle2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Provider {
  id: string
  name: string
  npi: string
  phone: string
  address: string
  specialty: string
  license: string
  confidence: number
  validated: boolean
  issues: string[]
}

interface ProviderTableProps {
  providers: Provider[]
  onViewDetail: (provider: Provider) => void
}

export default function ProviderTable({ providers, onViewDetail }: ProviderTableProps) {
  const getConfidenceBadgeClass = (confidence: number) => {
    if (confidence >= 90) return "status-approved"
    if (confidence >= 75) return "status-pending"
    return "status-rejected"
  }

  return (
    <Card className="stats-card">
      <CardHeader>
        <CardTitle className="text-base">Provider Results</CardTitle>
        <p className="text-xs text-muted-foreground">{providers.length} providers found</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 pl-4 pr-4">Name</th>
                <th className="pb-3 pl-4 pr-4">NPI</th>
                <th className="pb-3 pl-4 pr-4">Phone</th>
                <th className="pb-3 pl-4 pr-4">Specialty</th>
                <th className="pb-3 pl-4 pr-4">License</th>
                <th className="pb-3 pl-4 pr-4">Confidence</th>
                <th className="pb-3 pl-4 pr-4">Issues</th>
                <th className="pb-3 pl-4 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id} className="border-b border-border table-row-hover">
                  <td className="py-4 pl-4 pr-4">
                    <div className="flex items-center gap-2">
                      {provider.validated && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      <span className="text-sm text-foreground">{provider.name}</span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 pr-4 text-sm text-muted-foreground">{provider.npi}</td>
                  <td className="py-4 pl-4 pr-4 text-sm text-muted-foreground">{provider.phone}</td>
                  <td className="py-4 pl-4 pr-4 text-sm text-muted-foreground">{provider.specialty}</td>
                  <td className="py-4 pl-4 pr-4 text-sm text-muted-foreground">{provider.license}</td>
                  <td className="py-4 pl-4 pr-4">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium ${getConfidenceBadgeClass(provider.confidence)}`}
                    >
                      {provider.confidence}%
                    </span>
                  </td>
                  <td className="py-4 pl-4 pr-4">
                    {provider.issues.length > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{provider.issues.length}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 pl-4 pr-4">
                    <Button
                      onClick={() => onViewDetail(provider)}
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary/80 h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
