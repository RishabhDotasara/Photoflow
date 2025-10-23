"use client"

import { ProjectCard } from "@/components/dashboard-card"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { File, Plus } from "lucide-react"
import { CreateProjectModal } from "@/components/create-project-modal"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "@tanstack/react-query"
import { EmptyState } from "@/components/empty-state"

export default function ProjectsPage() {
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { user } = useUser();
    const [projects, setProjects] = useState([
        { projectName: "Summer Wedding 2025", totalPhotos: 342, totalGuests: 85, status: "done" as const },
        {
            projectName: "Corporate Event",
            totalPhotos: 156,
            totalGuests: 42,
            status: "processing" as const,
            uploadProgress: 75,
        },
        {
            projectName: "Birthday Party",
            totalPhotos: 89,
            totalGuests: 28,
            status: "uploading" as const,
            uploadProgress,
        },
        { projectName: "Family Reunion", totalPhotos: 512, totalGuests: 120, status: "done" as const },
        {
            projectName: "Product Shoot",
            totalPhotos: 234,
            totalGuests: 5,
            status: "processing" as const,
            uploadProgress: 45,
        },
        {
            projectName: "Conference 2025",
            totalPhotos: 678,
            totalGuests: 200,
            status: "uploading" as const,
            uploadProgress: 30,
        },
    ])

    // Simulate upload progress
    useEffect(() => {
        if (uploadProgress < 100) {
            const timer = setTimeout(() => {
                setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 100))
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [uploadProgress])

    const listProjectsQuery = useQuery({
        queryKey: ['projects', user?.publicMetadata?.userId],
        queryFn: async () => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/list-projects?user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                throw new Error("Failed to fetch projects");
            }
            const resJson = await resp.json();
            console.log(resJson);
            return resJson.projects;
        },
        onSuccess: (data: any) => {
            setProjects(data);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        enabled: user?.publicMetadata?.userId !== undefined,
    })

    const createProjectMutation = useMutation({
        mutationFn: async (projectName: string) => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/create-project`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: projectName,
                    user_id: user?.publicMetadata?.userId
                })
            })

            if (!resp.ok) {
                throw new Error("Failed to create project")
            }
            listProjectsQuery.refetch();
            return projectName;
        },
        onSuccess: (projectName: string) => {
            setIsModalOpen(false);
            const newProject = {
                projectName: projectName,
                totalPhotos: 0,
                totalGuests: 0,
                status: "uploading" as const,
                uploadProgress: 0,
            };
            setProjects((prevProjects) => [newProject, ...prevProjects]);
            // Optionally, you can refetch the projects list here to include the new project
        },
        onError: (error: any) => {
            console.error("Failed to create project:", error);
        }
    })

    const handleCreateProject = (projectName: string) => {
        createProjectMutation.mutate(projectName);
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto px-8 py-12">
                {/* Header with Add Project Button */}
                <div className="mb-12 flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Projects</h1>
                        <p className="text-muted-foreground">Manage your photo projects and track upload status</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 whitespace-nowrap" size="lg">
                        <Plus className="w-5 h-5" />
                        Add Project
                    </Button>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listProjectsQuery.data?.map((project: any, index: any) => (
                        <ProjectCard
                            id={project.project_id}
                            key={index}
                            projectName={project.name}
                            totalPhotos={project.image_count || 0}
                            status={project.status}
                            progress={project.uploadProgress}
                        />
                    ))}
                    
                </div>
                {listProjectsQuery.data?.length === 0 && (
                    <EmptyState
                        icon={<File />}
                        title="No Projects Found"
                        description="Create a new project to get started."
                        actionLabel="Add Project"
                        onAction={() => setIsModalOpen(true)}
                    />
                )}
            </main>

            <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateProject} />
        </div>
    )
}
