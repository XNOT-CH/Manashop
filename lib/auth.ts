import { auth } from "@/auth";
import { getCsrfTokenFromRequest, validateCsrfToken } from "@/lib/csrf";

interface AuthCheckResult {
    success: boolean;
    error?: string;
    userId?: string;
}

/**
 * Check if the current request is from an authenticated admin.
 * Uses NextAuth JWT session — no extra DB query needed.
 */
export async function isAdmin(): Promise<AuthCheckResult> {
    const session = await auth();

    if (!session?.user) return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };

    const role = (session.user as { role?: string }).role;
    if (role !== "ADMIN") return { success: false, error: "ไม่มีสิทธิ์เข้าถึง" };

    return { success: true, userId: session.user.id };
}

/**
 * Check admin + validate CSRF token.
 */
export async function isAdminWithCsrf(request: Request): Promise<AuthCheckResult> {
    const adminCheck = await isAdmin();
    if (!adminCheck.success) return adminCheck;

    const csrfToken = getCsrfTokenFromRequest(request);
    if (!csrfToken) return { success: false, error: "Missing CSRF token" };

    const isValidCsrf = await validateCsrfToken(csrfToken);
    if (!isValidCsrf) return { success: false, error: "Invalid CSRF token" };

    return { success: true, userId: adminCheck.userId };
}

/**
 * Check if the current request is from any authenticated user.
 */
export async function isAuthenticated(): Promise<AuthCheckResult> {
    const session = await auth();

    if (!session?.user) return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };

    return { success: true, userId: session.user.id };
}

/**
 * Check authenticated + validate CSRF token.
 */
export async function isAuthenticatedWithCsrf(request: Request): Promise<AuthCheckResult> {
    const authCheck = await isAuthenticated();
    if (!authCheck.success) return authCheck;

    const csrfToken = getCsrfTokenFromRequest(request);
    if (!csrfToken) return { success: false, error: "Missing CSRF token" };

    const isValidCsrf = await validateCsrfToken(csrfToken);
    if (!isValidCsrf) return { success: false, error: "Invalid CSRF token" };

    return { success: true, userId: authCheck.userId };
}
