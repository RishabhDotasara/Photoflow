"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, ImageIcon, CheckCircle2, Clock, Upload, Cog } from "lucide-react"
import Link from "next/link"

interface ProjectCardProps {
    id:string,
    projectName: string
    totalPhotos: number
    status: "waiting" | "processing" | "completed"
    progress?: number
}

const statusConfig = {
    waiting: {
        label: "Idle",
        icon: Cog,
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        dotColor: "bg-blue-500",
    },
    processing: {
        label: "Processing",
        icon: Clock,
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        dotColor: "bg-amber-500",
    },
    completed: {
        label: "Done",
        icon: CheckCircle2,
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        dotColor: "bg-emerald-500",
    },
}

export function ProjectCard({id, projectName, totalPhotos, status, progress = 0 }: ProjectCardProps) {
    const config = statusConfig[status]
    const StatusIcon = config?.icon

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <Link href={"my-projects/" + id}><h3 className="font-semibold text-lg text-foreground truncate hover:underline">{projectName}</h3></Link>
                    </div>
                    <Badge className={`${config?.color} border-0 flex items-center gap-1.5 whitespace-nowrap`}>
                        <span className={`w-2 h-2 rounded-full ${config?.dotColor} animate-pulse`} />
                        {config?.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Photos</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalPhotos}</p>
                    </div>
                </div>

                {/* Progress Bar - Only show for uploading/processing */}
                {/* {(status === "uploading" || status === "processing") && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                                {status === "uploading" ? "Upload Progress" : "Processing"}
                            </span>
                            {status === "uploading" && (
                                <span className="text-xs font-semibold text-foreground">{progress}%</span>
                            )}
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )} */}

                {/* Status Message */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {StatusIcon && <StatusIcon className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">
                        {status === "waiting" && "Click Start Processing to begin"}
                        {status === "processing" && "Processing and organizing photos..."}
                        {status === "completed" && "All photos uploaded and processed"}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
