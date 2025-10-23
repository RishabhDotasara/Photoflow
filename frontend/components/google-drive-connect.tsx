"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/clerk-react';
import { Cloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GoogleDriveConnect() {

    const { isSignedIn, user, isLoaded } = useUser();
    const router = useRouter();

    const handleConnect = async () => {
        try {
            if (!isSignedIn || !user) {
                throw new Error("User is not signed in");
            }
            // create the user first, here we assume that user will connect 
            const userCreationResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/create-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: user.primaryEmailAddress?.emailAddress
                })
            });
            let userId;
            if (userCreationResp.status == 400) {
                // user already exists, get the userId 
                const existingUserResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/get-user?email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || "")}`);
                if (existingUserResp.ok) {
                    const existingUserData = await existingUserResp.json();
                    userId = existingUserData.user_id;
                } else {
                    throw new Error("Failed to retrieve existing user");
                }
            }
            // initiate oauth flow 

            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/auth/drive/start?user_id=${userId}`, {redirect: 'manual'});
            if (resp.ok){
                window.location.href = (await resp.json()).auth_url;
            }
        }
        catch(err){
            console.error("Error connecting to Google Drive:", err);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto border-border/40">
            <CardHeader className="text-center space-y-2 pb-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold">Connect Google Drive</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Link your Google Drive to access and manage your files
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleConnect}
                    className="w-full"
                    size="lg"
                >
                    Connect
                </Button>
            </CardContent>
        </Card>
    );
}
export default GoogleDriveConnect; 