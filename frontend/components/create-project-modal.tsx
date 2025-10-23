"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (projectName: string) => void
}

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
    const [projectName, setProjectName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!projectName.trim()) return

        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        onCreate(projectName)
        setProjectName("")
        setIsLoading(false)
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-foreground">Create New Project</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                                Project Name
                            </label>
                            <Input
                                id="projectName"
                                placeholder="Enter project name..."
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                autoFocus
                                disabled={isLoading}
                                className="h-10"
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!projectName.trim() || isLoading}>
                                {isLoading ? "Creating..." : "Create Project"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
