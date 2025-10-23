"use client"

import { CheckCircle2, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Phase {
    id: string
    name: string
    status: "completed" | "in-progress" | "idle"
}

interface ProcessingPhasesProps {
    phases: Phase[]
    activePhaseId?: string
}

export function ProcessingPhases({ phases, activePhaseId }: ProcessingPhasesProps) {
    const activePhase = phases.find((phase) => phase.id === activePhaseId)
    const displayPhase = activePhase || phases[phases.length - 1]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Processing Status</CardTitle>
                <CardDescription>Current phase in progress</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-6 ${displayPhase.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-200 dark:ring-emerald-800"
                                : displayPhase.status === "in-progress"
                                    ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-200 dark:ring-blue-800"
                                    : "bg-muted"
                            }`}
                    >
                        {displayPhase.status === "completed" ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        ) : displayPhase.status === "in-progress" ? (
                            <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                        ) : (
                            <Clock className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground text-center">{displayPhase.name}</h3>
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                        {displayPhase.status === "completed"
                            ? "Now you can share the link"
                            : displayPhase.status === "in-progress"
                                ? "Currently processing..."
                                : "Waiting to start"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
