"use client"
import { useRef, useState, useEffect } from "react"
import { Camera, RotateCw, Check, X, Download, Sparkles, ImageIcon, Loader2, ChevronDown } from "lucide-react"

import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { downloadImagesAsZipBatched } from "@/lib/download-utils"

export default function SelfieCapture() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [generatedImages, setGeneratedImages] = useState<any>([])
    const [uploadComplete, setUploadComplete] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [downloadStatus, setDownloadStatus] = useState("")
    const [isDownloading, setIsDownloading] = useState(false)
    const { project_id } = useParams()
    const { user } = useUser()

    const startCamera = async () => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 1280, height: 720 },
                audio: false,
            })
            setStream(mediaStream)
            setIsCameraActive(true)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            setError("Unable to access camera. Please ensure camera permissions are granted.")
            console.error("Camera error:", err)
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
            setIsCameraActive(false)
        }
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const context = canvas.getContext("2d")
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                const imageData = canvas.toDataURL("image/jpeg", 0.9)
                setCapturedImage(imageData)
                stopCamera()
            }
        }
    }

    const retakePhoto = () => {
        setCapturedImage(null)
        startCamera()
    }

    const sendToServer = async () => {
        if (!capturedImage) return

        setIsLoading(true)
        try {
            const blob = await (await fetch(capturedImage)).blob()
            const response = await uploadSelfieToServer(blob)

            toast.success("Selfie uploaded successfully!", {
                description: "Finding your photos...",
            })

            if (response.matching_images_count == 0) {
                toast.info("No matching images found", {
                    description: "Try uploading a clearer selfie with better lighting.",
                })
                setUploadComplete(true)
                setGeneratedImages([])
                setCapturedImage(null)
                return
            }

            if (response.matching_images) {
                setGeneratedImages(response.matching_images)
                setUploadComplete(true)
                toast.success(`Found ${response.matching_images.length} photos!`, {
                    description: "Your photos are ready to download.",
                })
            }

            setCapturedImage(null)
        } catch (err) {
            toast.error("Failed to upload selfie", {
                description: "Please try again.",
            })
            console.error("Upload error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const uploadSelfieToServer = async (imageBlob: Blob) => {
        const formData = new FormData()
        formData.append("file", imageBlob, "selfie.jpg")
        formData.append("project_id", String(project_id))

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/guest/upload-selfie`, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            throw new Error("Upload failed")
        }

        return await response.json()
    }

    const handleDownloadAll = async () => {
        if (generatedImages.length === 0) return

        setIsDownloading(true)
        setDownloadProgress(0)
        setDownloadStatus("Preparing download...")

        try {
            const images = generatedImages.map((item: any, index: number) => ({
                url: item.image.download_url,
                name: `photo-${index + 1}.jpg`,
            }))

            await downloadImagesAsZipBatched(
                images,
                `my-photos-${Date.now()}.zip`,
                (progress, status) => {
                    setDownloadProgress(progress)
                    setDownloadStatus(status)
                },
                3
            )

            toast.success("Download complete!", {
                description: "Your photos have been saved.",
            })
        } catch (error) {
            console.error("Download failed:", error)
            toast.error("Download failed", {
                description: "Please try again or download individually.",
            })
        } finally {
            setIsDownloading(false)
            setDownloadProgress(0)
            setDownloadStatus("")
        }
    }

    const resetFlow = () => {
        setGeneratedImages([])
        setUploadComplete(false)
        setCapturedImage(null)
    }

    const scrollToImages = () => {
        document.getElementById("images-grid")?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    // Results page with images
    if (uploadComplete && generatedImages.length > 0) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="font-semibold">Your Photos</h1>
                                    <p className="text-xs text-muted-foreground">
                                        {generatedImages.length} {generatedImages.length === 1 ? "photo" : "photos"} found
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={resetFlow}
                                    variant="ghost"
                                    size="sm"
                                >
                                    <RotateCw className="w-4 h-4 mr-2" />
                                    New Search
                                </Button>
                                <Button
                                    onClick={handleDownloadAll}
                                    disabled={isDownloading}
                                    size="sm"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {downloadProgress}%
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download All
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {isDownloading && (
                            <div className="mt-3">
                                <Progress value={downloadProgress} className="h-1" />
                                <p className="text-xs text-muted-foreground mt-1">{downloadStatus}</p>
                            </div>
                        )}
                    </div>
                </header>

                {/* Images Grid */}
                <main id="images-grid" className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                        {generatedImages.map((item: any, index: number) => (
                            <div
                                key={item.image.id}
                                className="group relative aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary/50 transition-colors"
                            >
                                <img
                                    src={item.image.thumbnail_url}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="secondary"
                                    >
                                        <a href={item.image.download_url} target="_blank" download>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </a>
                                    </Button>
                                </div>

                                {/* Index Badge */}
                                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge variant="secondary" className="text-xs">
                                        {index + 1}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t mt-auto">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <p className="text-sm text-muted-foreground text-center">
                            Made with ❤️ by <span className="font-medium text-foreground">Webops & Blockchain Club</span>
                        </p>
                    </div>
                </footer>
            </div>
        )
    }

    // No results page
    if (uploadComplete && generatedImages.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <Card className="w-full max-w-sm">
                    <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">No Photos Found</h2>
                            <p className="text-sm text-muted-foreground">
                                Try a clearer selfie with better lighting.
                            </p>
                        </div>

                        <Button onClick={resetFlow} className="w-full">
                            <RotateCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Camera capture page
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Camera className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-semibold">Find Your Photos</h1>
                            <p className="text-xs text-muted-foreground">Take a selfie to get started</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-lg space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Camera View */}
                    <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                        {!isCameraActive && !capturedImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-background border flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Ready to capture</p>
                                        <p className="text-xs text-muted-foreground">Click the button below</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
                        />

                        {capturedImage && (
                            <div className="relative w-full h-full">
                                <img
                                    src={capturedImage}
                                    alt="Captured selfie"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="bg-green-500 text-white border-0 text-xs">
                                        <Check className="w-3 h-3 mr-1" />
                                        Ready
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />

                        {/* Face guide overlay */}
                        {isCameraActive && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-40 h-48 border-2 border-dashed border-white/40 rounded-full" />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {!isCameraActive && !capturedImage && (
                            <Button onClick={startCamera} className="flex-1 h-11">
                                <Camera className="w-4 h-4 mr-2" />
                                Start Camera
                            </Button>
                        )}

                        {isCameraActive && !capturedImage && (
                            <>
                                <Button onClick={capturePhoto} className="flex-1 h-11">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Capture
                                </Button>
                                <Button onClick={stopCamera} variant="outline" size="icon" className="h-11 w-11">
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        )}

                        {capturedImage && (
                            <>
                                <Button
                                    onClick={sendToServer}
                                    disabled={isLoading}
                                    className="flex-1 h-11"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Find Photos
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={retakePhoto}
                                    variant="outline"
                                    size="icon"
                                    disabled={isLoading}
                                    className="h-11 w-11"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="rounded-lg border bg-muted/50 p-3">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Tip:</span> Face the camera directly with good lighting. Remove sunglasses or hats for better results.
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <p className="text-xs text-muted-foreground text-center">
                        Made with ❤️ by <span className="font-medium text-foreground">Webops & Blockchain Club</span>
                    </p>
                </div>
            </footer>
        </div>
    )
}