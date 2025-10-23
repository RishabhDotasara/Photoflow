"use client"

import { Share2, Copy, Check, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ShareableLinkCardProps {
    shareLink: string
    projectName: string
}

export function ShareableLinkCard({ shareLink, projectName }: ShareableLinkCardProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: projectName,
                text: `Check out my project: ${projectName}`,
                url: shareLink,
            })
        }
    }

    return (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Project
                </CardTitle>
                <CardDescription>Share this link with guests to view photos</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">Shareable Link</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground"
                            />
                            <Button variant="default" size="sm" onClick={handleCopy} className="flex-shrink-0">
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 bg-transparent" onClick={handleShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button variant="outline" className="flex-1 bg-transparent">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                        </Button>
                    </div>

                    <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                        <p>Anyone with this link can view and download photos from this project.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
