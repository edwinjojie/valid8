"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Info } from "lucide-react"

export default function DemoPage() {
    return (
        <div className="p-4 space-y-4">
            {/* Header Card */}
            <Card className="stats-border">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">System Demo</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                        Watch a complete walkthrough of the Valid8 Care Provider Validation System
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Video Player Card */}
            <Card className="stats-border">
                <CardContent className="p-6">
                    <div className="relative w-full rounded-lg overflow-hidden bg-black shadow-2xl">
                        <video
                            className="w-full h-auto"
                            controls
                            preload="metadata"
                            style={{ maxHeight: "70vh" }}
                        >
                            <source src="/video/demo1.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </CardContent>
            </Card>

            {/* Information Card */}
            <Card className="stats-border">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">About This Demo</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            This demonstration showcases the complete workflow of the Valid8 system, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Uploading healthcare provider data files</li>
                            <li>Automated validation and processing</li>
                            <li>Real-time progress tracking</li>
                            <li>Comprehensive results dashboard</li>
                            <li>Detailed provider information analysis</li>
                            <li>Report generation capabilities</li>
                        </ul>
                        <p className="mt-4 text-xs">
                            <strong>Note:</strong> This demo video is provided for evaluation purposes to demonstrate
                            the system's functionality without requiring live LLM processing.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
