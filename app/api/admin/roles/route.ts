import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET /api/admin/roles - List all roles
export async function GET() {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { error: "ไม่ได้เข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์เข้าถึง" },
                { status: 403 }
            );
        }

        // Fetch all roles with user count
        const roles = await db.role.findMany({
            include: {
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูลยศ" },
            { status: 500 }
        );
    }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { error: "ไม่ได้เข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์เข้าถึง" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, displayName, iconUrl, color, permissions, sortOrder } = body;

        // Validate required fields
        if (!name || !displayName) {
            return NextResponse.json(
                { error: "กรุณากรอกชื่อยศให้ครบถ้วน" },
                { status: 400 }
            );
        }

        // Check if role name already exists
        const existingRole = await db.role.findUnique({
            where: { name },
        });

        if (existingRole) {
            return NextResponse.json(
                { error: "ชื่อยศนี้มีอยู่แล้ว" },
                { status: 400 }
            );
        }

        // Create new role
        const newRole = await db.role.create({
            data: {
                name,
                displayName,
                iconUrl: iconUrl || null,
                color: color || "#6366f1",
                permissions: JSON.stringify(permissions || []),
                sortOrder: sortOrder || 0,
                isSystem: false,
            },
        });

        return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
        console.error("Error creating role:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการสร้างยศ" },
            { status: 500 }
        );
    }
}
