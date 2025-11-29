"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BadgeInfoIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProcessingPhases } from "@/components/processing-phases"

import { ShareableLinkCard } from "@/components/shareable-link-card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { FolderSelector } from "@/components/drive-folder-info"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { IconReload } from "@tabler/icons-react"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"
import { Progress } from "@/components/ui/progress"
export default function ProjectDescriptionPage() {
    const [processingProgress, setProcessingProgress] = useState(0)
    const params = useParams<{ id: string }>();
    const { user } = useUser();
    const [filesUploaded, setFilesUploaded] = useState(0);
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const offset = useRef(0);

    const uploadImagesMutation = useMutation({
        mutationFn: async (files: File[]) => {
            console.log("Uploading files:", files.length);
            let cursor = 0;

            // Process all files in batches of 20
            while (cursor < files.length) {
                // Get current batch (don't mutate original array)
                const batchSize = Math.min(20, files.length - cursor);
                const currentBatch = files.slice(cursor, cursor + batchSize);

                // Get presigned URLs for current batch
                const presignedURLsResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/get-presigned-urls`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        object_names: currentBatch.map((file) =>
                            `${user?.publicMetadata.userId}/${getProjectQuery.data?.name}/${file.name}`
                        ),
                    }),
                });

                if (!presignedURLsResp.ok) {
                    throw new Error(`Failed to get presigned URLs: ${presignedURLsResp.statusText}`);
                }

                const presignedURLsData = await presignedURLsResp.json();
                const presignedURLs: string[] = presignedURLsData.presigned_urls;

                // Upload current batch
                await Promise.all(presignedURLs.map((url, index) => {
                    return fetch(url, {
                        method: 'PUT',
                        body: currentBatch[index], // Use currentBatch instead of mutated files
                        headers: {
                            'Content-Type': currentBatch[index].type,
                        }
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error(`Upload failed: ${response.statusText}`);
                        }
                        setFilesUploaded((prev) => prev + 1);
                    });
                }));

                cursor += batchSize;
            }
        },
        onError: (error: any) => {
            toast.error("Upload failed", {
                description: error.message
            });
        },
        onSuccess: () => {
            toast.success("All files uploaded successfully!");
            setFiles([]); // Clear the dropzone
            setFilesUploaded(0); // Reset counter
        }
    });

    const createProcessingRequestMutation = useMutation({
        mutationFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/create-processing-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project_id: params.id,
                    user_id: user?.publicMetadata?.userId,
                }),
            });
            if (!resp.ok) {
                throw new Error("Failed to create processing request");
            }
            return resp.json();
        },
        onSuccess: () => {
            toast.success("Processing request created successfully", {description: "Your images will be processed once admins approve."});
        },
        onError: () => {
            toast.error("Failed to create processing request");
        }
    })

    interface Folder {
        folder_id: string
        name: string
    }

    // Simulate processing progress

    // Mock project data
    const project = {
        id: params.id,
        name: "Summer Wedding 2025",
        totalPhotos: 342,
        totalGuests: 85,
        status: "processing" as const,
        driveFolderName: "Wedding_Photos_2025_Summer",
        driveFolderUrl: "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
        fileCount: 342,
        shareLink: "https://photohub.app/share/summer-wedding-2025",
    }


    const getProjectQuery = useQuery({
        queryKey: ['project', project.id],
        queryFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/get-project?project_id=${project.id}`);
            if (!resp.ok) {
                throw new Error("Failed to fetch project data");
            }
            const resJson = await resp.json();
            console.log(resJson);
            return resJson.project;
        },
        staleTime: 1 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchInterval: 5 * 60 * 1000,
        enabled: user?.publicMetadata?.userId !== undefined,
    })

    const getProgressQuery = useQuery({
        queryKey: ['processing-progress', project.id],
        queryFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/get-progress?project_id=${project.id}`);
            if (!resp.ok) {
                throw new Error("Failed to fetch processing progress");
            }
            const resJson = await resp.json();
            console.log("Progress:", resJson);
            return resJson
        },
        staleTime: 2000, // 30 seconds
        refetchOnWindowFocus: true,
        refetchInterval: 2000,
        enabled: getProjectQuery.data?.status === "processing" && getProjectQuery.isSuccess,
        onSuccess: (data) => {
            setProcessingProgress(data);
        }
    })

    

    const startResyncMutation = useMutation({
        mutationFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/resync-drive-folder?project_id=${project.id}&user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                toast.error("Some went wrong!")
                throw new Error("Failed to start resync");
            }
            if (resp.ok) {
                toast.success("Resync started successfully");
            }
        }
    })


    const phases = [
        {
            id: "1",
            name: "Image Processing",
            status: "in-progress" as const,

        },
        {
            id: "2",
            name: "Idle",
            status: "idle" as const,
        },
        {
            id: "3",
            name: "Completed",
            status: "completed" as const,
        }
    ]
    const statusMap: Record<string, string> = {
        "waiting": "2",
        "processing": "1",
        "completed": "3"
    }

    return (
        <div className="min-h-screen bg-background">

            <main className="max-w-6xl mx-auto py-4">
                {/* Back Button */}
                <Link
                    href="/my-projects"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </Link>

                {/* Header */}
                <div className="mb-12">

                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">{getProjectQuery.data?.name || "Loading.."}</h1>
                            <p className="text-muted-foreground">Project ID: {project.id}</p>
                            {user?.publicMetadata?.userId}
                        </div>
                        {/* <Badge variant={project.status === "processing" ? "secondary" : "default"}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge> */}
                        {getProjectQuery.data?.status === "processing" && <Badge className="bg-amber-400">Processing</Badge>}

                        <div className="flex justify-center items-center gap-4">
                            <Button variant={"outline"} onClick={() => { getProjectQuery.refetch() }} disabled={getProjectQuery.isRefetching}><IconReload /></Button>
                            <Button disabled={getProjectQuery.data?.status === "processing" || createProcessingRequestMutation.isPending} onClick={() => { createProcessingRequestMutation.mutate() }}>
                                {createProcessingRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                
                                Start Analysis</Button>
                        </div>
                        {/* {getProjectQuery.data?.status === "completed" && <Badge className="bg-green-400">Completed</Badge>} */}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="text-muted-foreground">
                                Total Processed Photos
                            </CardHeader>
                            <CardContent>
                                {/* <p className="text-sm text-muted-foreground mb-1">Total Photos</p> */}
                                <p className="text-3xl font-bold text-foreground">{getProjectQuery.data?.image_count || 0} </p>
                            </CardContent>
                        </Card>

                        {getProjectQuery.data?.status === "processing" && (
                            <Card>
                                <CardHeader>
                                    Processing Progress
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Image Preparation Progress</p>
                                        <div className="flex gap-2 items-center">
                                            <Progress value={getProgressQuery.data?.preparation_progress || 0} className="h-2 rounded-md" />
                                            <span className="font-semibold">{Math.round(getProgressQuery.data?.preparation_progress || 0)}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Thumbnail Generation Progress</p>
                                        <div className="flex gap-2 items-center">
                                            <Progress value={Math.round(getProgressQuery.data?.thumbnails_progress || 0)} className="h-2 rounded-md" />
                                            <span className="font-semibold">{Math.round(getProgressQuery.data?.thumbnails_progress || 0)}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Image Processing Progress</p>
                                        <div className="flex gap-2 items-center">
                                            <Progress value={getProgressQuery.data?.image_processing_progress || 0} className="h-2 rounded-md" />
                                            <span className="font-semibold">{Math.round(getProgressQuery.data?.image_processing_progress || 0)}%</span>
                                        </div>
                                    </div>
                                </CardContent>

                            </Card>)}

                        {getProjectQuery.data?.out_of_sync && getProjectQuery.data?.status !== "processing" && <Card>
                            <CardHeader className="text-muted-foreground">
                                <div className="flex items-center gap-2 justify-start">
                                    Out of Sync Drive
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <BadgeInfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Number of images that are not synchronized with your Google Drive folder</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>
                            {/* <CardContent>
                                <p className="text-3xl font-bold text-foreground">{getProjectQuery.data?.out_of_sync_count || 0} </p>
                            </CardContent> */}
                            <CardFooter className="flex justify-end">
                                <Button onClick={() => { createProcessingRequestMutation.mutate() }}>Sync Now & Process</Button>
                            </CardFooter>
                        </Card>}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Processing & Drive Info */}
                    <div className="lg:col-span-2 space-y-8">

                        <ProcessingPhases phases={phases} activePhaseId={statusMap[getProjectQuery.data?.status || "idle"] || "2"} />

                        {!uploadImagesMutation.isPending && (
                            <Dropzone
                                accept={{ 'image/*': [] }}
                                onDrop={(droppedFiles) => {
                                    setFiles(droppedFiles); // Store files first
                                    uploadImagesMutation.mutate(droppedFiles);
                                }}
                                onError={(e) => {
                                    toast.error("Error selecting files", { description: e.message })
                                }}
                                multiple={true}
                                disabled={uploadImagesMutation.isPending} // Disable during upload
                                maxFiles={20000}
                            >

                                <DropzoneContent/>
                                <DropzoneEmptyState/>
                            </Dropzone>
                        )}

                        {uploadImagesMutation.isPending && (
                            <Card className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Uploading files...</span>
                                        <span>{filesUploaded} / {files.length}</span>
                                    </div>
                                    <Progress value={(filesUploaded / files.length) * 100} />
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Shareable Link */}
                    <div>
                        <ShareableLinkCard shareLink={`https://photoflow.cfiwebops.com/guest/${project.id}`} projectName={project.name} />
                    </div>
                </div>
            </main>
        </div>
    )
}
