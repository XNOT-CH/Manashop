import crypto from "crypto";

// Get encryption key from environment — MUST be set in production
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;

if (process.env.NODE_ENV === "production" && !ENCRYPTION_KEY_RAW) {
    throw new Error("[encryption] ENCRYPTION_KEY environment variable is not set. Please set a 32-character key.");
}

// Development fallback — NOT safe for production
const ENCRYPTION_KEY = ENCRYPTION_KEY_RAW ?? "gamestore-secret-key-12345678901";

if (Buffer.byteLength(ENCRYPTION_KEY, "utf8") !== 32) {
    throw new Error(`[encryption] ENCRYPTION_KEY must be exactly 32 bytes for AES-256, got ${Buffer.byteLength(ENCRYPTION_KEY, "utf8")}.`);
}

const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY),
        iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt sensitive data
 */
export function decrypt(text: string): string {
    try {
        const parts = text.split(":");
        if (parts.length !== 2) {
            // Data is not encrypted, return as-is (for backward compatibility)
            return text;
        }
        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = Buffer.from(parts[1], "hex");
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(ENCRYPTION_KEY),
            iv
        );
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        // If decryption fails, return original text (backward compatibility)
        return text;
    }
}

/**
 * Check if text is encrypted
 */
export function isEncrypted(text: string): boolean {
    const parts = text.split(":");
    if (parts.length !== 2) return false;
    // Check if both parts are valid hex strings
    const hexRegex = /^[0-9a-f]+$/i;
    return hexRegex.test(parts[0]) && hexRegex.test(parts[1]) && parts[0].length === 32;
}
