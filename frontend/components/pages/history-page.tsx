"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { History, Search, Download, Trash2, Eye, FileText, TrendingUp, Database } from "lucide-react"
import { getValidationHistory, deleteValidationJob, clearAllHistory, getStorageStats, downloadJSON, type ValidationJob } from "@/lib/storage"

interface HistoryPageProps {
    onViewResults?: (job: ValidationJob) => void
}

export default function HistoryPage({ onViewResults }: HistoryPageProps) {
    const [history, setHistory] = useState<ValidationJob[]>([])
    const [filteredHistory, setFilteredHistory] = useState<ValidationJob[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [stats, setStats] = useState({ count: 0, sizeKB: 0 })

    useEffect(() => {
        loadHistory()
    }, [])

    useEffect(() => {
        // Filter history based on search query
        if (searchQuery.trim() === "") {
            setFilteredHistory(history)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = history.filter(job =>
                job.fileName.toLowerCase().includes(query) ||
                job.jobId.toLowerCase().includes(query) ||
                job.status.toLowerCase().includes(query)
            )
            setFilteredHistory(filtered)
        }
    }, [searchQuery, history])

    const loadHistory = () => {
        const jobs = getValidationHistory()
        setHistory(jobs)
        setFilteredHistory(jobs)
        setStats(getStorageStats())
    }

    const handleDelete = (jobId: string) => {
        deleteValidationJob(jobId)
        loadHistory()
    }

    const handleClearAll = () => {
        clearAllHistory()
        loadHistory()
    }

    const handleDownload = (job: ValidationJob) => {
        downloadJSON(job, `validation_${job.jobId}.json`)
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = Date.now()
        const diff = now - timestamp

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000)
            return minutes === 0 ? "Just now" : `${minutes}m ago`
        }
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000)
            return `${hours}h ago`
        }
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000)
            return `${days}d ago`
        }
        // Default to date string
        return date.toLocaleDateString()
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return "N/A"
        const seconds = Math.floor(ms / 1000)
        if (seconds < 60) return `${seconds}s`
        const minutes = Math.floor(seconds / 60)
        return `${minutes}m ${seconds % 60}s`
    }

    const totalSuccess = history.filter(j => j.status === 'completed').length
    const totalFailed = history.filter(j => j.status === 'failed').length
    const successRate = history.length > 0 ? ((totalSuccess / history.length) * 100).toFixed(1) : '0'

    return (
        <div className="p-4 space-y-4 max-w-7xl mx-auto">
            {/* Page Description */}
            <Card className="stats-border bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">Validation History</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                        View and manage all past validation jobs. All data is stored locally in your browser for privacy and quick access.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="stats-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription>Total Jobs</CardDescription>
                                <CardTitle className="text-2xl mt-1">{stats.count}</CardTitle>
                            </div>
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                    </CardHeader>
                </Card>

                <Card className="stats-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription>Success Rate</CardDescription>
                                <CardTitle className="text-2xl mt-1 text-green-600">{successRate}%</CardTitle>
                            </div>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                    </CardHeader>
                </Card>

                <Card className="stats-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription>Failed Jobs</CardDescription>
                                <CardTitle className="text-2xl mt-1 text-red-600">{totalFailed}</CardTitle>
                            </div>
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                    </CardHeader>
                </Card>

                <Card className="stats-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription>Storage Used</CardDescription>
                                <CardTitle className="text-2xl mt-1">{stats.sizeKB} KB</CardTitle>
                            </div>
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Search and Actions */}
            <Card className="stats-border">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="relative flex-1 w-full md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by filename or job ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-destructive hover:text-destructive" disabled={history.length === 0}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Clear All History
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all {history.length} validation jobs from your local storage. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                                        Delete All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                {searchQuery ? "No matching jobs found" : "No validation history yet"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term" : "Complete a validation to see your history here"}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Providers</TableHead>
                                        <TableHead>Valid</TableHead>
                                        <TableHead>Avg Confidence</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.map((job) => (
                                        <TableRow key={job.jobId}>
                                            <TableCell className="font-medium text-sm">
                                                {formatDate(job.timestamp)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{job.fileName}</TableCell>
                                            <TableCell>
                                                {job.status === 'completed' ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                                                        Completed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">Failed</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{job.stats.totalProviders}</TableCell>
                                            <TableCell className="text-green-600">{job.stats.validCount}</TableCell>
                                            <TableCell>{(job.stats.avgConfidence * 100).toFixed(0)}%</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDuration(job.duration)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {onViewResults && job.status === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onViewResults(job)}
                                                            title="View Results"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(job)}
                                                        title="Download JSON"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" title="Delete">
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the validation job for "{job.fileName}".
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(job.jobId)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
