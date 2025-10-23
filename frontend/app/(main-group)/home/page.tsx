"use client"

import { Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProcessingStatus } from "@/components/processing-status"
import { PhotosCredit } from "@/components/photos-credit"
import { auth } from "@clerk/nextjs/server"
import { SignInButton } from "@clerk/nextjs"
import { SignedIn, useAuth, useUser } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import GoogleDriveConnect from "@/components/google-drive-connect"

export default function Home() {

    const { isLoaded, isSignedIn, sessionId, getToken } = useAuth()
    const {user} = useUser();
    const userId = user?.publicMetadata?.userId as string
    console.log(userId)
    // check if drive is connected
    const driveCheckQuery = useQuery({
        queryKey: ['drive-permission', userId],
        queryFn: async () => {
            if (!userId) return false;
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/has-drive-permission?user_id=${userId}`
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
            return data.has_drive_permission;
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: true
    })

    const getHomeInfoQuery = useQuery({
        queryKey: ['home-info', userId],
        queryFn: async () => {
            if (!userId) return null;
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/home-info?user_id=${userId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
            return data;
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false
    })



    
    if (!isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4 text-foreground">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">You must be signed in to view this page.</p>
                    <SignInButton>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                            Sign In
                        </button>
                    </SignInButton>
                </div>
            </div>
        )
    }

    if (isSignedIn && !driveCheckQuery.data) {
        return (
            <div className="h-full w-full">
                <GoogleDriveConnect/>
            </div>
        )
    }


    const processingItems = [
        { id: "1", name: "Corporate Event - Processing", status: "processing" as const, progress: 75 },
        { id: "2", name: "Birthday Party - Uploading", status: "processing" as const, progress: 45 },
        { id: "3", name: "Summer Wedding - Done", status: "done" as const, progress: 100 },
    ]

    const activeProjects = processingItems.filter((item) => item.status === "processing").length

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto py-2">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Monitor active processes and photo processing status</p>
                </div>

                {/* Active Projects Card */}
                <div className="mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Active Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-foreground">{getHomeInfoQuery.data?.project_count}</div>
                            <p className="text-sm text-muted-foreground mt-2">Projects currently processing</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Processing */}
                    <div className="lg:col-span-2">
                        <ProcessingStatus items={processingItems} />
                    </div>

                    {/* Photos Credit */}
                    <PhotosCredit processed={134} total={1000} />
                </div>
            </main>
        </div>
    )
}
