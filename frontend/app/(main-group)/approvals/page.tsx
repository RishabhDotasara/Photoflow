"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, Mail, MessageSquare, Calendar, Loader2, ProjectorIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@clerk/nextjs"

export default function AdminApprovalsPage() {
    const queryClient = useQueryClient();
    const {user} = useUser();

    const getAccessRequestQuery = useQuery({
        queryKey: ["access-requests"],
        queryFn: async () => {
            try 
            {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/access-requests`)
                
                return res.json();

            }
            catch(err)
            {
                console.log(err)
                toast.error("Failed to fetch access requests");
            }
        },
        staleTime: 1000 * 60 * 5,
    })

    const getProcessingRequestQuery = useQuery({
        queryKey: ["processing-requests"],
        queryFn: async () => {
            try 
            {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/processing-requests`)
               
                return res.json();
            }
            catch(err)
            {
                console.log(err)
                toast.error("Failed to fetch processing requests");
            }
        },
        staleTime: 1000 * 60 * 5,
    })

    const approveAccessMutation = useMutation({
        mutationFn: async (data:{id: string, clerk_id:string}) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/approve-access-requests`, {
                method: 'POST',
                body: JSON.stringify({
                    request_id: data.id, 
                    approver_id: user?.publicMetadata?.userId, 
                    clerk_user_id: data.clerk_id
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error("Failed to approve");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Request approved successfully");
            queryClient.invalidateQueries({ queryKey: ["access-requests"] });
        },
        onError: () => {
            toast.error("Failed to approve request");
        },
    });

    const approveProcessingMutation = useMutation({
        mutationFn: async (data: {request_id:string, approver_id:string}) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/approve-processing-requests`, {
                method: 'POST',
                body: JSON.stringify({
                    request_id: data.request_id, 
                    approver_id: data.approver_id
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error("Failed to approve");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Request approved successfully");
            queryClient.invalidateQueries({ queryKey: ["processing-requests"] });
        },
        onError: () => {
            toast.error("Failed to approve request");
        },
    })

    const startAnalysisMutation = useMutation({
        mutationFn: async (project_id:string) => {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/analyze-folder?project_id=${project_id}&user_id=${user?.publicMetadata?.userId}`);
            if (!resp.ok) {
                throw new Error("Failed to start analysis");
            }
            return resp.json();
        },
        onSuccess: () => {
            toast.success("Analysis started successfully");
        },
        onError: () => {
            toast.error("Failed to start analysis");
        }
    })

    const pendingAccessCount = getAccessRequestQuery.data?.requests?.filter((r: any) => r.status === "pending").length || 0;
    const pendingProcessingCount = getProcessingRequestQuery.data?.requests?.filter((r: any) => r.status === "pending").length || 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Approvals</h1>
                    <p className="mt-2 text-muted-foreground">Review and manage pending requests</p>
                </div>

                <Tabs defaultValue="ar" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="ar" className="gap-2">
                            Access Requests
                            {pendingAccessCount > 0 && (
                                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                                    {pendingAccessCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pr" className="gap-2">
                            Processing Requests
                            {pendingProcessingCount > 0 && (
                                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                                    {pendingProcessingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Access Requests Tab */}
                    <TabsContent value="ar" className="space-y-4">
                        {getAccessRequestQuery.isLoading ? (
                            // Loading State
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                                <Skeleton className="h-16 w-full mt-4" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : getAccessRequestQuery.data?.requests?.length === 0 ? (
                            // Empty State
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Check className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">No pending access requests</p>
                                </CardContent>
                            </Card>
                        ) : (
                            // Request Cards
                            <div className="space-y-4">
                                {getAccessRequestQuery.data?.requests?.map((request: any) => (
                                    <Card
                                        key={request.id}
                                        className="group overflow-hidden border-border hover:border-primary/20 transition-all duration-200"
                                    >
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row">
                                                {/* Left Content */}
                                                <div className="flex-1 p-6">
                                                    {/* Header Row */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Mail className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {request.user?.email || request.email}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(request.created_at || new Date().toISOString())}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                request.status === "approved" ? "default" :
                                                                    request.status === "rejected" ? "destructive" :
                                                                        "secondary"
                                                            }
                                                            className="capitalize"
                                                        >
                                                            {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                                            {request.status}
                                                        </Badge>
                                                    </div>

                                                    {/* Reason Section */}
                                                    <div className="bg-muted/50 rounded-lg p-4">
                                                        <div className="flex items-start gap-2">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                                    Reason for Access
                                                                </p>
                                                                <p className="text-sm text-foreground leading-relaxed">
                                                                    {request.user_reason || request.reason || "No reason provided"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Actions Panel */}
                                                {request.status === "pending" && (
                                                    <div className="flex sm:flex-col gap-2 p-4 sm:p-6 border-t sm:border-t-0 sm:border-l border-border bg-muted/30 sm:w-36 justify-center">
                                                        <Button
                                                            onClick={() => approveAccessMutation.mutate({id:request.id, clerk_id:request.clerk_id})}
                                                            disabled={approveAccessMutation.isPending }
                                                            size="sm"
                                                            className="flex-1 sm:flex-initial gap-1.5"
                                                        >
                                                            {approveAccessMutation.isPending ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                            Approve
                                                        </Button>
                                                        {/* <Button
                                                            onClick={() => rejectAccessMutation.mutate(request.id)}
                                                            disabled={approveAccessMutation.isPending || rejectAccessMutation.isPending}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 sm:flex-initial gap-1.5"
                                                        >
                                                            {rejectAccessMutation.isPending ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <X className="h-3.5 w-3.5" />
                                                            )}
                                                            Reject
                                                        </Button> */}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Processing Requests Tab */}
                    <TabsContent value="pr" className="space-y-4">
                        {/* {JSON.stringify(getProcessingRequestQuery.data)} */}
                        {getProcessingRequestQuery.isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <Card key={i} className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : getProcessingRequestQuery.data?.requests?.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Check className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">No pending processing requests</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {getProcessingRequestQuery.data?.requests?.map((request: any) => (
                                    <Card
                                        key={request.id}
                                        className="group overflow-hidden border-border hover:border-primary/20 transition-all duration-200"
                                    >
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Mail className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {request.user?.email || request.userEmail}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(request.created_at || new Date().toISOString())}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                request.status === "approved" ? "default" :
                                                                    request.status === "rejected" ? "destructive" :
                                                                        "secondary"
                                                            }
                                                            className="capitalize"
                                                        >
                                                            {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                                            {request.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="bg-muted/50 rounded-lg p-4">
                                                        <div className="flex items-start gap-2">
                                                            {/* <ProjectorIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" /> */}
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                                    Project
                                                                </p>
                                                                <p className="text-sm text-foreground leading-relaxed">
                                                                    {request.project.name || "No Project Name"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {request.status === "pending" && (
                                                    <div className="flex sm:flex-col gap-2 p-4 sm:p-6 border-t sm:border-t-0 sm:border-l border-border bg-muted/30 sm:w-36 justify-center">
                                                        <Button size="sm" className="flex-1 sm:flex-initial gap-1.5" onClick={()=>{
                                                            startAnalysisMutation.mutate(request.project.id)
                                                        }}>
                                                            <Check className="h-3.5 w-3.5" />
                                                            Approve
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial gap-1.5">
                                                            <X className="h-3.5 w-3.5" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}