"use client"

import { Share2, Copy, Check, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

interface ShareableLinkCardProps {
    shareLink: string
    projectName: string
}

export function ShareableLinkCard({ shareLink, projectName }: ShareableLinkCardProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: projectName,
                    text: `Check out my project: ${projectName}`,
                    url: shareLink,
                })
            } catch (err) {
                console.log('Share cancelled')
            }
        }
    }

    const handleEmail = () => {
        const subject = encodeURIComponent(`Check out my project: ${projectName}`)
        const body = encodeURIComponent(`Hi,\n\nI'd like to share my project with you: ${projectName}\n\nView it here: ${shareLink}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
    }

    return (
        <Card className="w-full max-w-2xl border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Share2 className="w-5 h-5 text-primary" />
                            </div>
                            <span>Share Project</span>
                        </CardTitle>
                        <CardDescription className="text-base">
                            Share this link with guests to view photos
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex whitespace-nowrap">
                        Public Access
                    </Badge>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Shareable Link</p>
                        <Badge variant="outline" className="sm:hidden">Public</Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="pr-4 font-mono text-sm bg-muted/50 border-border/50 focus-visible:ring-1"
                            />
                        </div>
                        <Button
                            variant={copied ? "default" : "secondary"}
                            size="default"
                            onClick={handleCopy}
                            className="w-full sm:w-auto transition-all"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    <span>Copy Link</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Separator />
{/* 
                <div className="space-y-3">
                    <p className="text-sm font-medium">Share via</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-accent transition-colors"
                            onClick={handleShare}
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            <span>Share Options</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-accent transition-colors"
                            onClick={handleEmail}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            <span>Send via Email</span>
                        </Button>
                    </div>
                </div> */}

                <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Anyone with this link can view and download photos from this project. The link does not expire and can be shared freely.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
