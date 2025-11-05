"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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
export default function ProjectDescriptionPage() {
    const [processingProgress, setProcessingProgress] = useState(0)
    const params = useParams<{id:string}>();
    const {user} = useUser();
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const offset = useRef(0); 

    const uploadImagesMutation = useMutation({
        mutationFn: async (files: File[]) => {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images', file);
            });
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
        refetchInterval:5 * 60 * 1000,
        enabled: user?.publicMetadata?.userId !== undefined ,
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
            const fraction = resJson.processed_images / getProjectQuery.data?.image_count;
            if (fraction == 1){
                getProjectQuery.refetch();
            }
            return fraction * 100;
        },
        staleTime: 2000, // 30 seconds
        refetchOnWindowFocus: true,
        refetchInterval: 2000,
        enabled: getProjectQuery.data?.status === "processing" && getProjectQuery.isSuccess,
        onSuccess: (data) => {
            setProcessingProgress(data);
        }
    })
    
    const startAnalysisMutation = useMutation({
        mutationFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/analyze-folder?project_id=${project.id}&user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                throw new Error("Failed to start analysis");
            }
            // refetch the project status and everything
            getProjectQuery.refetch();

            return resp.json();
        },
        onSuccess: () => {
            toast.success("Analysis started successfully");
            getProjectQuery.refetch();
        },
        onError: () => {
            toast.error("Failed to start analysis");
        }
    })

    const startResyncMutation = useMutation({
        mutationFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/resync-drive-folder?project_id=${project.id}&user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                toast.error("Some went wrong!")
                throw new Error("Failed to start resync");
            }
            if (resp.ok){
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
            id:"2",
            name: "Idle",
            status: "idle" as const,
        },
        {
            id:"3",
            name: "Completed",
            status: "completed" as const,
        }
    ]
    const statusMap: Record<string, string> = {
        "waiting": "2",
        "processing":"1",
        "completed":"3"
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
                        </div>
                        {/* <Badge variant={project.status === "processing" ? "secondary" : "default"}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge> */}
                        {getProjectQuery.data?.status === "processing" && <Badge className="bg-amber-400">Processing</Badge>}
                        
                        <div className="flex justify-center items-center gap-4">
                        <Button variant={"outline"} onClick={()=>{getProjectQuery.refetch()}} disabled={getProjectQuery.isRefetching}><IconReload/></Button>
                        <Button disabled={getProjectQuery.data?.status === "processing"} onClick={() => {startAnalysisMutation.mutate()}}>Start Analysis</Button>
                        </div>
                        {/* {getProjectQuery.data?.status === "completed" && <Badge className="bg-green-400">Completed</Badge>} */}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="text-muted-foreground">
                                Total Photos
                            </CardHeader>
                            <CardContent>
                                {/* <p className="text-sm text-muted-foreground mb-1">Total Photos</p> */}
                                <p className="text-3xl font-bold text-foreground">{getProjectQuery.data?.image_count || 0} </p>
                            </CardContent>
                        </Card>

                        {getProjectQuery.data?.status === "processing" && (
                            <Card>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
                                    <p className="text-3xl font-bold text-foreground">{Math.round(processingProgress)}%</p>
                                </CardContent>

                        </Card>)}

                        {getProjectQuery.data?.out_of_sync && <Card>
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
                                <Button onClick={()=>{startResyncMutation.mutate()}}>Sync Now & Process</Button>
                            </CardFooter>
                        </Card>}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Processing & Drive Info */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        <ProcessingPhases phases={phases} activePhaseId={statusMap[getProjectQuery.data?.status || "idle"] || "2"} />
                        
                        {/* {isFolderSelectedQuery.data ? <FolderSelector
                            folders={listFoldersQuery.data}
                            initialFolder={isFolderSelectedQuery.data.folder_info}
                            isSaved={isFolderSelectedQuery.data.bool}
                            onSave={(folder) => {
                                saveFolderIdMutation.mutate(folder)
                            }}
                        />:(
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                        )} */}
                       <Dropzone
                        accept={{'image/*':[]}}
                        onDrop={()=>{uploadImagesMutation.mutate(files)}}
                        onError={(e)=>{toast.error("Error Uploading Files, Please try again!", {description: e.message})}}
                        multiple={true}
                        src={files}
                        maxFiles={20000}
                       >
                        <DropzoneContent />
                        <DropzoneEmptyState/>
                       </Dropzone>
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
