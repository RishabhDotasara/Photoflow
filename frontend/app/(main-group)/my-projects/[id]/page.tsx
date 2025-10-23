"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProcessingPhases } from "@/components/processing-phases"

import { ShareableLinkCard } from "@/components/shareable-link-card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { FolderSelector } from "@/components/drive-folder-info"
import { Button } from "@/components/ui/button"
export default function ProjectDescriptionPage() {
    const [processingProgress, setProcessingProgress] = useState(45)
    const params = useParams<{id:string}>();
    const {user} = useUser();
    const router = useRouter();

    interface Folder {
        folder_id: string
        name: string
    }

    // Simulate processing progress
    useEffect(() => {
        const timer = setInterval(() => {
            setProcessingProgress((prev) => {
                if (prev >= 100) return 100
                return prev + Math.random() * 15
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

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

    const listFoldersQuery = useQuery({
        queryKey: ['folders', project.id],
        queryFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/list-folders?user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
            if (resp.status === 500){
                // so this probably happens because the refresh token is invalid, so take the user to onboarding flow again.
                router.push("/onboard-user?redirect_url=/my-projects/"+project.id);
                toast.error("Please re-authorize Google Drive access to continue.");
                return;
            }
                // window.location.href = "/onboard-user?redirect_url=/my-projects/"+project.id;
            }
            const resJson = await resp.json();
            console.log(resJson);
            return resJson.folders;
        },
        
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        enabled: user?.publicMetadata?.userId !== undefined,
    }) 

    const isFolderSelectedQuery = useQuery({
        queryKey: ['is-folder-set', project.id],
        queryFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/folder-drive-id-set?project_id=${project.id}`);
            if (!resp.ok) {
                throw new Error("Failed to fetch folder status");
            }
            const resJson = await resp.json();
            // console.log(resJson);
            return resJson;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        // retry: 1,

    })

    const saveFolderIdMutation = useMutation({
        mutationFn: async (folder: any) => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/set-folder-id?project_id=${project.id}&folder_id=${folder.id}&user_id=${user?.publicMetadata?.userId}`)
            if (!resp.ok) {
                throw new Error("Failed to save folder ID")
            }
            return resp.json()
        },
        onSuccess: () => {
            toast.success("Folder linked successfully")
            isFolderSelectedQuery.refetch();
        },
        onError: () => {
            toast.error("Failed to link folder")
        },
    })

    
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
        enabled: user?.publicMetadata?.userId !== undefined ,
    })
    
    const startAnalysisMutation = useMutation({
        mutationFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/analyze-folder?project_id=${project.id}&user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                throw new Error("Failed to start analysis");
            }
            // refetch the project status and everything

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
                        {getProjectQuery.data?.status === "waiting" && (isFolderSelectedQuery.data?.bool ?<Button onClick={()=>{startAnalysisMutation.mutate();getProjectQuery.refetch()}} disabled={startAnalysisMutation.isPending}>
                            
                            {startAnalysisMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
                            Start Processing</Button> : <Badge className="bg-blue-400">Select a folder to start analysis</Badge>)}
                        {getProjectQuery.data?.status === "completed" && <Badge className="bg-green-400">Completed</Badge>}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground mb-1">Total Photos</p>
                                <p className="text-3xl font-bold text-foreground">{getProjectQuery.data?.image_count || 0} </p>
                            </CardContent>
                        </Card>
        
                        {/* <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
                                <p className="text-3xl font-bold text-foreground">{Math.round(processingProgress)}%</p>
                            </CardContent>

                        </Card> */}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Processing & Drive Info */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        <ProcessingPhases phases={phases} activePhaseId={statusMap[getProjectQuery.data?.status || "idle"] || "2"} />
                        
                        {isFolderSelectedQuery.data ? <FolderSelector
                            folders={listFoldersQuery.data}
                            initialFolder={isFolderSelectedQuery.data.folder_info}
                            onSave={(folder) => {
                                saveFolderIdMutation.mutate(folder)
                            }}
                        />:(
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                        )}
                    </div>

                    {/* Right Column - Shareable Link */}
                    <div>
                        <ShareableLinkCard shareLink={`${window?.location.origin}/guest/${project.id}`} projectName={project.name} />
                    </div>
                </div>
            </main>
        </div>
    )
}
