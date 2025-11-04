"use client"
import { useRef, useState, useEffect } from "react"
import { Camera, RotateCw, Check, X, Download } from "lucide-react"

import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"

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
    const { project_id } = useParams()
    const { user } = useUser()
    const downloadURL = (driveId: string)=>{
        return `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}` + `/drive-img/${driveId}?user_id=${user?.publicMetadata.userId}`
    }

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
            console.log(response)

            toast.success("Selfie uploaded successfully!")

            if (response.matching_images_count == 0){
                toast.info("No matching images found for the uploaded selfie." )
                setUploadComplete(true)
                setGeneratedImages([])
                setCapturedImage(null)
                return
            }

            if (response.matching_images) {
                setGeneratedImages(response.matching_images)
                setUploadComplete(true)
            }

            setCapturedImage(null)
        } catch (err) {
            toast.error("Failed to upload selfie. Please try again.")
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

        const json = await response.json()
        console.log("Upload response status:", json)
        return json
    }

    const downloadImage = (imageUrl: string, index: number) => {
        const link = document.createElement("a")
        link.href = imageUrl
        link.download = `image-${index + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const resetFlow = () => {
        setGeneratedImages([])
        setUploadComplete(false)
        setCapturedImage(null)
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    if (uploadComplete && generatedImages.length > 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="text-center space-y-3">
                        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                            {generatedImages.length} {generatedImages.length === 1 ? "Image" : "Images"} Found
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your Images</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Click on any image to download it to your device
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {generatedImages.map((item: any, index: number) => (
                            <div
                                key={item.image.id}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-muted shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                <img
                                    src={item.image.download_url}
                                    alt={`image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                                        <span className="text-white font-medium text-sm">Image {index + 1}</span>
                                        <Button
                                            // onClick={() => downloadImage(downloadURL(item.image.drive_file_id) + "&download=true", index)}
                                            size="sm"
                                            className="bg-white text-black hover:bg-white/90"
                                        >
                                            <Download className="w-4 h-4 mr-1.5" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-4">
                        <Button onClick={resetFlow} variant="outline" size="lg" className="h-12 px-8">
                            <RotateCw className="w-5 h-5 mr-2" />
                            Upload Another Selfie
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
            <Card className="w-full max-w-2xl shadow-2xl border-2">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tight">Take Your Selfie</CardTitle>
                    <CardDescription className="text-base">
                        Position yourself in the frame and capture a clear photo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-inner">
                        {!isCameraActive && !capturedImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                        <Camera className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">Camera not active</p>
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
                            <img
                                src={capturedImage}
                                alt="Captured selfie"
                                className="w-full h-full object-cover"
                            />
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isCameraActive && !capturedImage && (
                            <Button onClick={startCamera} size="lg" className="flex-1 h-12 text-base">
                                <Camera className="w-5 h-5 mr-2" />
                                Start Camera
                            </Button>
                        )}

                        {isCameraActive && !capturedImage && (
                            <>
                                <Button onClick={capturePhoto} size="lg" className="flex-1 h-12 text-base">
                                    <Camera className="w-5 h-5 mr-2" />
                                    Capture Photo
                                </Button>
                                <Button onClick={stopCamera} variant="outline" size="lg" className="h-12 bg-transparent">
                                    <X className="w-5 h-5 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        )}

                        {capturedImage && (
                            <>
                                <Button onClick={sendToServer} disabled={isLoading} size="lg" className="flex-1 h-12 text-base">
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5 mr-2" />
                                            Submit Selfie
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={retakePhoto}
                                    variant="outline"
                                    size="lg"
                                    disabled={isLoading}
                                    className="h-12 bg-transparent"
                                >
                                    <RotateCw className="w-5 h-5 mr-2" />
                                    Retake
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                            Your photo will be securely uploaded to our server
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


