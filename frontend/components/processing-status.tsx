import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2 } from "lucide-react"

interface ProcessingItem {
    id: string
    name: string
    status: "processing" | "done"
    progress: number
}

interface ProcessingStatusProps {
    items: ProcessingItem[]
}

export function ProcessingStatus({ items }: ProcessingStatusProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {item.status === "processing" ? (
                                    <div className="p-2 rounded-full bg-amber-500/10">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    </div>
                                ) : (
                                    <div className="p-2 rounded-full bg-emerald-500/10">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {item.status === "done" ? "Completed" : "In Progress"}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={item.status === "done" ? "default" : "secondary"} className="text-sm">
                                {item.status === "done" ? "Done" : `${item.progress}%`}
                            </Badge>
                        </div>
                        {item.status === "processing" && (
                            <div className="space-y-2">
                                <Progress value={item.progress} className="h-2.5" />
                                <p className="text-xs text-muted-foreground text-right">{item.progress}% complete</p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
