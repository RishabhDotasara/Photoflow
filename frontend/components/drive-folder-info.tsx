"use client"

import { FolderOpen, Search, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Folder {
    folder_id: string
    name: string
}

interface FolderSelectorProps {
    folders: Folder[]
    onSave: (folder: Folder) => void
    initialFolder?: Folder
}

export function FolderSelector({ folders, onSave, initialFolder }: FolderSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [tempSelected, setTempSelected] = useState<Folder | null>(initialFolder || null)
    const [isSaving, setIsSaving] = useState(false)

    const filteredFolders = folders?.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const handleFolderSelect = (folder: Folder) => {
        setTempSelected(folder)
    }

    const handleReselect = () => {
        setTempSelected(null)
        setSearchQuery("")
    }

    const handleSave = () => {
        if (tempSelected) {
            setIsSaving(true)
            onSave(tempSelected)
            setIsSaving(false)
        }
    }

    // Selection mode - show folder list
    if (!tempSelected) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        Select a Folder
                    </CardTitle>
                    <CardDescription>Choose a folder to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search folders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <ScrollArea className="h-[300px] rounded-md border">
                            <div className="p-4 space-y-2">
                                {filteredFolders?.length > 0 ? (
                                    filteredFolders.map((folder) => (
                                        <button
                                            key={folder.folder_id}
                                            onClick={() => handleFolderSelect(folder)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3 group"
                                        >
                                            <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{folder.name}</p>
                                                <p className="text-xs text-muted-foreground">{folder.folder_id}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{searchQuery ? "No folders found" : "No folders available"}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Confirmation mode - show selected folder with save/reselect options
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Folder Selected
                </CardTitle>
                <CardDescription>Review your selection before saving</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Selected Folder Display */}
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Selected Folder</p>
                        <div className="flex items-start gap-3">
                            <FolderOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            {/* {JSON.stringify(tempSelected)} */}
                            <div className="flex-1 min-w-0">
                                <p className="text-lg font-semibold text-foreground break-words">{tempSelected.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">ID: {tempSelected.folder_id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button onClick={handleReselect} variant="outline" className="flex-1 bg-transparent">
                            Reselect
                        </Button>
                        <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
                            {isSaving && <Loader2 className="animate-spin"/>}
                            Save Folder
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
