/**
 * Client-side image compression utility.
 * Compresses images to fit within a target file size (default: 300KB).
 * Uses Canvas API to re-encode images as WebP/JPEG with iterative quality reduction.
 */

const DEFAULT_MAX_SIZE_BYTES = 300 * 1024; // 300KB
const MAX_GIF_SVG_SIZE = 2 * 1024 * 1024; // 2MB limit for GIF/SVG
const MAX_DIMENSION = 1920; // Max width/height

/**
 * Compress an image file to be within the target size.
 * @param file - The original image File
 * @param maxSizeBytes - Maximum file size in bytes (default: 300KB)
 * @returns A compressed File object
 */
export async function compressImage(
    file: File,
    maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
): Promise<File> {
    // If already small enough, return as-is
    if (file.size <= maxSizeBytes) {
        return file;
    }

    // Skip non-image files
    if (!file.type.startsWith("image/")) {
        return file;
    }

    // GIF/SVG can't be canvas-compressed — enforce 2MB limit
    if (file.type === "image/gif" || file.type === "image/svg+xml") {
        if (file.size > MAX_GIF_SVG_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            throw new Error(
                `ไฟล์ ${file.type === "image/gif" ? "GIF" : "SVG"} มีขนาด ${sizeMB}MB เกินขีดจำกัด 2MB กรุณาลดขนาดไฟล์ก่อนอัพโหลด`
            );
        }
        return file;
    }

    const imageBitmap = await createImageBitmap(file);
    let { width, height } = imageBitmap;

    // Scale down if too large
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Try WebP first, then JPEG
    const outputType = "image/webp";

    // Iteratively reduce quality until the file is small enough
    let quality = 0.85;
    let blob: Blob | null = null;

    for (let i = 0; i < 10; i++) {
        blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, outputType, quality)
        );

        if (!blob) break;
        if (blob.size <= maxSizeBytes) break;

        // Reduce quality
        quality -= 0.1;
        if (quality < 0.1) {
            // If still too large at minimum quality, scale down dimensions
            width = Math.round(width * 0.75);
            height = Math.round(height * 0.75);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(imageBitmap, 0, 0, width, height);
            quality = 0.5;
        }
    }

    if (!blob) {
        return file; // Fallback to original
    }

    // Create a new File with .webp extension
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, {
        type: outputType,
        lastModified: Date.now(),
    });
}
