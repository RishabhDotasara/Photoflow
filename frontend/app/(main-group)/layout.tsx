"use client"
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent } from '@/components/ui/card'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useUser } from '@clerk/nextjs'
import { AlertTriangle } from 'lucide-react'
import React from 'react'

export default function layout({children}: {children: React.ReactNode}) {

    const {user} = useUser();

    if (!user?.publicMetadata.verified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-border bg-card">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Access Restricted</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your account is not verified. Request access from an Admin first.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }




  return (
      <SidebarProvider
          style={
              {
                  "--sidebar-width": "calc(var(--spacing) * 72)",
                  "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
          }
      >
          <AppSidebar variant="inset" />
          <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                          {/* <SectionCards /> */}
                      </div>
                  </div>
              </div>
              {children}
          </SidebarInset>
      </SidebarProvider>
  )
}
