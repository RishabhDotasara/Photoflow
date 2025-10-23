import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon } from "lucide-react"

interface PhotosCreditProps {
    processed: number
    total: number
}

export function PhotosCredit({ processed, total }: PhotosCreditProps) {
    const percentage = Math.round((processed / total) * 100)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Photos Processed
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">{processed}</span>
                    <span className="text-lg text-muted-foreground">/ {total}</span>
                </div>
                <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground text-right">{percentage}% Complete</p>
                </div>
            </CardContent>
        </Card>
    )
}
