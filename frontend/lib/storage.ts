// Local Storage utility for validation job history

export interface ValidationJob {
    jobId: string
    timestamp: number // Unix timestamp
    fileName: string
    fileSize: number
    status: 'completed' | 'failed'
    duration?: number // milliseconds
    results?: any // Full results object
    error?: string
    stats: {
        totalProviders: number
        validCount: number
        invalidCount: number
        avgConfidence: number
    }
}

const STORAGE_KEY = 'valid8_history'
const MAX_JOBS = 100 // Limit storage to prevent exceeding localStorage limits

export function saveValidationJob(jobData: ValidationJob): void {
    try {
        const history = getValidationHistory()

        // Add new job at the beginning (most recent first)
        history.unshift(jobData)

        // Keep only the most recent MAX_JOBS
        const trimmed = history.slice(0, MAX_JOBS)

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (error) {
        console.error('Failed to save validation job:', error)
    }
}

export function getValidationHistory(): ValidationJob[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        // If no history exists, load seed data from static file
        if (!stored) {
            const seeded = localStorage.getItem('valid8_seeded')
            if (!seeded) {
                // Load seed data on first visit
                loadSeedData()
                const newStored = localStorage.getItem(STORAGE_KEY)
                if (newStored) {
                    const parsed = JSON.parse(newStored)
                    return Array.isArray(parsed) ? parsed : []
                }
            }
            return []
        }

        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
    } catch (error) {
        console.error('Failed to retrieve validation history:', error)
        return []
    }
}

async function loadSeedData() {
    try {
        const response = await fetch('/seed-history.json')
        if (response.ok) {
            const seedData = await response.json()
            if (Array.isArray(seedData) && seedData.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
                localStorage.setItem('valid8_seeded', 'true')
                console.log('Loaded seed history data:', seedData.length, 'jobs')
            }
        }
    } catch (error) {
        console.error('Failed to load seed data:', error)
    }
}

export function getValidationById(jobId: string): ValidationJob | null {
    const history = getValidationHistory()
    return history.find(job => job.jobId === jobId) || null
}

export function deleteValidationJob(jobId: string): void {
    try {
        const history = getValidationHistory()
        const filtered = history.filter(job => job.jobId !== jobId)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
        console.error('Failed to delete validation job:', error)
    }
}

export function clearAllHistory(): void {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
        console.error('Failed to clear history:', error)
    }
}

export function getStorageStats(): { count: number; sizeKB: number } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const sizeBytes = stored ? new Blob([stored]).size : 0
        const history = getValidationHistory()

        return {
            count: history.length,
            sizeKB: Math.round(sizeBytes / 1024)
        }
    } catch (error) {
        console.error('Failed to get storage stats:', error)
        return { count: 0, sizeKB: 0 }
    }
}

export function downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function downloadCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
        console.warn('No data to download')
        return
    }

    // Extract headers from first object
    const headers = Object.keys(data[0])
    const csvRows = []

    // Add header row
    csvRows.push(headers.join(','))

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header]
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""')
            return escaped.includes(',') ? `"${escaped}"` : escaped
        })
        csvRows.push(values.join(','))
    }

    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
