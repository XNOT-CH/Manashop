import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * validateBody — parse + validate request body ผ่าน Zod schema
 *
 * Usage:
 *   const result = await validateBody(req, mySchema);
 *   if ("error" in result) return result.error;
 *   const data = result.data; // typed ✅
 */
export async function validateBody<T extends z.ZodTypeAny>(
    req: Request,
    schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return {
            error: NextResponse.json(
                { success: false, message: "Request body ไม่ถูกต้อง (invalid JSON)" },
                { status: 400 }
            ),
        };
    }

    const result = schema.safeParse(raw);
    if (!result.success) {
        const firstMessage = result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
        return {
            error: NextResponse.json(
                {
                    success: false,
                    message: firstMessage,
                    errors: result.error.issues.reduce((acc, issue) => {
                        const key = String(issue.path[0] || '_root');
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(issue.message);
                        return acc;
                    }, {} as Record<string, string[]>),
                },
                { status: 400 }
            ),
        };
    }

    return { data: result.data as z.infer<T> };
}
