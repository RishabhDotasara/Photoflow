"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { downloadImagesAsZipBatched } from '@/lib/download-utils';

interface DownloadAllButtonProps {
    images: { url: string; name: string }[];
    projectName?: string;
}

export function DownloadAllButton({ images, projectName = 'images' }: DownloadAllButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleDownload = async () => {
        if (images.length === 0) return;

        setIsDownloading(true);
        setProgress(0);

        try {
            await downloadImagesAsZipBatched(
                images,
                `${projectName}-${Date.now()}.zip`,
                (prog, stat) => {
                    setProgress(prog);
                    setStatus(stat);
                },
                5 // batch size
            );
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsDownloading(false);
            setProgress(0);
            setStatus('');
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={isDownloading || images.length === 0}
            className="gap-2"
        >
            {isDownloading ? (
                <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    <span>{status || `${progress}%`}</span>
                </>
            ) : (
                <>
                    <IconDownload className="h-4 w-4" />
                    <span>Download All ({images.length})</span>
                </>
            )}
        </Button>
    );
}