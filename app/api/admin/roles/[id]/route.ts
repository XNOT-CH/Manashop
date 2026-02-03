import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// PUT /api/admin/roles/[id] - Update role
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Check if role exists
        const existingRole = await db.role.findUnique({
            where: { id },
        });

        if (!existingRole) {
            return NextResponse.json(
                { error: "ไม่พบยศที่ต้องการแก้ไข" },
                { status: 404 }
            );
        }

        // Prevent editing system roles
        if (existingRole.isSystem) {
            return NextResponse.json(
                { error: "ไม่สามารถแก้ไขยศระบบได้" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, displayName, iconUrl, color, permissions, sortOrder } = body;

        // If changing name, check for duplicates
        if (name && name !== existingRole.name) {
            const duplicate = await db.role.findUnique({
                where: { name },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: "ชื่อยศนี้มีอยู่แล้ว" },
                    { status: 400 }
                );
            }
        }

        // Update role
        const updatedRole = await db.role.update({
            where: { id },
            data: {
                name: name || existingRole.name,
                displayName: displayName || existingRole.displayName,
                iconUrl: iconUrl !== undefined ? iconUrl : existingRole.iconUrl,
                color: color || existingRole.color,
                permissions: permissions ? JSON.stringify(permissions) : existingRole.permissions,
                sortOrder: sortOrder !== undefined ? sortOrder : existingRole.sortOrder,
            },
        });

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error("Error updating role:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการแก้ไขยศ" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Check if role exists
        const existingRole = await db.role.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });

        if (!existingRole) {
            return NextResponse.json(
                { error: "ไม่พบยศที่ต้องการลบ" },
                { status: 404 }
            );
        }

        // Prevent deleting system roles
        if (existingRole.isSystem) {
            return NextResponse.json(
                { error: "ไม่สามารถลบยศระบบได้" },
                { status: 403 }
            );
        }

        // Check if role has users
        if (existingRole._count.users > 0) {
            return NextResponse.json(
                { error: `ไม่สามารถลบยศนี้ได้ เนื่องจากมีผู้ใช้ ${existingRole._count.users} คนที่ใช้ยศนี้อยู่` },
                { status: 400 }
            );
        }

        // Delete role
        await db.role.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "ลบยศสำเร็จ" });
    } catch (error) {
        console.error("Error deleting role:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบยศ" },
            { status: 500 }
        );
    }
}
