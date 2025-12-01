import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadImagesAsZip(
    images: { url: string; name: string }[],
    zipFileName: string = 'images.zip',
    onProgress?: (progress: number) => void
) {
    const zip = new JSZip();
    const total = images.length;
    let completed = 0;

    // Download all images and add to zip
    const downloadPromises = images.map(async (image) => {
        try {
            const response = await fetch(image.url);
            if (!response.ok) throw new Error(`Failed to fetch ${image.name}`);

            const blob = await response.blob();
            zip.file(image.name, blob);

            completed++;
            onProgress?.(Math.round((completed / total) * 100));
        } catch (error) {
            console.error(`Failed to download ${image.name}:`, error);
        }
    });

    await Promise.all(downloadPromises);

    // Generate and download zip
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    }, (metadata) => {
        // Optional: track zip generation progress
        console.log(`Zipping: ${metadata.percent.toFixed(1)}%`);
    });

    saveAs(zipBlob, zipFileName);
}

// Download with concurrent limit to avoid overwhelming the browser
export async function downloadImagesAsZipBatched(
    images: { url: string; name: string }[],
    zipFileName: string = 'images.zip',
    onProgress?: (progress: number, status: string) => void,
    batchSize: number = 5
) {
    const zip = new JSZip();
    const total = images.length;
    let completed = 0;

    // Process in batches
    for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        await Promise.all(batch.map(async (image) => {
            try {
                const response = await fetch(image.url);
                if (!response.ok) throw new Error(`Failed to fetch ${image.name}`);

                const blob = await response.blob();
                zip.file(image.name, blob);

                completed++;
                onProgress?.(
                    Math.round((completed / total) * 100),
                    `Downloading ${completed}/${total}`
                );
            } catch (error) {
                console.error(`Failed to download ${image.name}:`, error);
            }
        }));
    }

    onProgress?.(100, 'Creating ZIP file...');

    // Generate and download zip
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    saveAs(zipBlob, zipFileName);
    onProgress?.(100, 'Complete!');
}