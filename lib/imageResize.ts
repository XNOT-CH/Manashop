/**
 * Resize & crop an image File to a square using Canvas API (client-side only).
 * Returns a Blob in WebP format ready for upload.
 *
 * @param file     The original File from <input type="file">
 * @param size     Output square size in pixels (default 400)
 * @param quality  WebP quality 0–1 (default 0.9)
 */
export function resizeToSquare(
    file: File,
    size = 400,
    quality = 0.9,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas not supported"));
                return;
            }

            // Center-crop: take the largest square from the center of the image
            const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
            const srcX = (img.naturalWidth - srcSize) / 2;
            const srcY = (img.naturalHeight - srcSize) / 2;

            ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                },
                "image/webp",
                quality,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Failed to load image"));
        };

        img.src = objectUrl;
    });
}

/**
 * Convenience: resize a File then wrap the resulting Blob back into a File.
 */
export async function resizeFileToSquare(
    file: File,
    size = 400,
    quality = 0.9,
): Promise<File> {
    const blob = await resizeToSquare(file, size, quality);
    const name = file.name.replace(/\.[^.]+$/, ".webp");
    return new File([blob], name, { type: "image/webp" });
}
