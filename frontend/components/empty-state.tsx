"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    icon: ReactNode
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6">
            {/* Icon Container */}
            <div className="mb-6 p-4 rounded-full bg-muted/50">
                <div className="text-muted-foreground">{icon}</div>
            </div>

            {/* Content */}
            <div className="text-center max-w-md">
                <h3 className="text-2xl font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">{description}</p>

                {/* Action Button */}
                {actionLabel && onAction && (
                    <Button onClick={onAction} size="lg">
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    )
}
