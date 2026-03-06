import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no DB / bcrypt imports).
 * Used by middleware.ts for route protection.
 */
export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Paths that require authentication
            const isProtected =
                pathname.startsWith("/dashboard") ||
                pathname.startsWith("/admin") ||
                pathname.startsWith("/api/admin") ||
                pathname.startsWith("/profile");

            // Paths that require ADMIN role
            const isAdminPath =
                pathname.startsWith("/admin") ||
                pathname.startsWith("/api/admin");

            if (!isLoggedIn && isProtected) {
                return false; // Will redirect to /login
            }

            if (isAdminPath && isLoggedIn) {
                const role = (auth?.user as { role?: string })?.role;
                if (role !== "ADMIN") {
                    return Response.redirect(new URL("/", nextUrl));
                }
            }

            return true;
        },
        jwt({ token, user }) {
            // Persist user id and role into the JWT token
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role ?? "USER";
                token.username = (user as { username?: string }).username ?? "";
            }
            return token;
        },
        session({ session, token }) {
            // Expose id and role on the session object
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { username?: string }).username = token.username as string;
            }
            return session;
        },
    },
    providers: [], // Providers defined in auth.ts (Node.js runtime)
};
