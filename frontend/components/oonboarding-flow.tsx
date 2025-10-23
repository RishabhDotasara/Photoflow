"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Mail, CheckCircle2, Cloud } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"

type OnboardingPhase = "email" | "google-drive" | "complete"

interface OnboardingFlowProps {
    onComplete?: () => void
}


 
async function connectGoogleDrive(userId: string): Promise<void> {
    // TODO: Replace with actual Google OAuth flow
    console.log("Connecting Google Drive for user:", userId)
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [phase, setPhase] = useState<OnboardingPhase>("email")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const {user} = useUser();
    const userId = user?.publicMetadata?.userId as string

    const createUserMutation = useMutation({
        mutationFn: async (email: string) => {
            console.log(user?.id)
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, clerkId:user?.id }),
            });
            if (!response.ok) {
                if (response.status === 400) {
                    setPhase("google-drive")
                    // throw new Error('User already exists');
                    return;
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        onSuccess: (data) => {
            console.log('User created successfully:', data);
        },
        onError: (error) => {
            console.error('Error creating user:', error);
        },
    })


    // Phase 1: Email signup
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const data = await createUserMutation.mutateAsync(email)
            setPhase("google-drive")
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Phase 2: Google Drive connection
    const handleGoogleDriveConnect = async () => {
        setError("")
        setIsLoading(true)

        try {
            let userIdDB;

            const existingUserResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/get-user?email=${email}`);
            if (existingUserResp.ok) {
                const existingUserData = await existingUserResp.json();
                userIdDB = existingUserData.user_id;
            } else {
                throw new Error("Failed to retrieve existing user");
            }

            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/auth/drive/start?user_id=${userIdDB}`, { redirect: 'manual' });
            if (resp.ok) {
                window.location.href = (await resp.json()).auth_url;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                {/* Phase 1: Email */}
                {phase === "email" && (
                    <div className="p-8">
                        <div className="mb-6">
                            {process.env.NEXT_PUBLIC_BACKEND_BASE_URL}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome</h1>
                            <p className="text-muted-foreground">Create your account to get started</p>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            <Button type="submit" disabled={isLoading || !email} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Phase 2: Google Drive */}
                {phase === "google-drive" && (
                    <div className="p-8">
                        <div className="mb-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                                <Cloud className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Connect Google Drive</h1>
                            <p className="text-muted-foreground">Link your Google Drive to sync your files</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <Button onClick={handleGoogleDriveConnect} disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Cloud className="w-4 h-4 mr-2" />
                                    Connect Google Drive
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Phase 3: Complete */}
                {phase === "complete" && (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">All set!</h1>
                        <p className="text-muted-foreground mb-6">Your account is ready to use</p>
                        <Button className="w-full" onClick={onComplete}>
                            Get Started
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}
