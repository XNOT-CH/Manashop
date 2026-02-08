"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึงข้อมูลยศตาม ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const role = await db.role.findUnique({
            where: { id },
        });

        if (!role) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(role);
    } catch (error) {
        console.error("Error fetching role:", error);
        return NextResponse.json(
            { error: "Failed to fetch role" },
            { status: 500 }
        );
    }
}

// PUT - แก้ไขยศ
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, code, iconUrl, description, permissions, sortOrder } = body;

        if (!name || !code) {
            return NextResponse.json(
                { error: "Name and code are required" },
                { status: 400 }
            );
        }

        // Check if role exists
        const existingRole = await db.role.findUnique({
            where: { id },
        });

        if (!existingRole) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Check if new code conflicts with another role
        if (code.toUpperCase() !== existingRole.code) {
            const codeConflict = await db.role.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (codeConflict) {
                return NextResponse.json(
                    { error: "Role code already exists" },
                    { status: 400 }
                );
            }
        }

        const role = await db.role.update({
            where: { id },
            data: {
                name,
                code: code.toUpperCase(),
                iconUrl: iconUrl || null,
                description: description || null,
                permissions: permissions ? JSON.stringify(permissions) : null,
                sortOrder: sortOrder !== undefined ? sortOrder : existingRole.sortOrder,
            },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.ROLE_UPDATE || "ROLE_UPDATE",
            resource: "Role",
            resourceId: role.id,
            details: { name, code },
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error("Error updating role:", error);
        return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
        );
    }
}

// DELETE - ลบยศ (ยกเว้นยศระบบ)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const role = await db.role.findUnique({
            where: { id },
        });

        if (!role) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Cannot delete system roles
        if (role.isSystem) {
            return NextResponse.json(
                { error: "Cannot delete system role" },
                { status: 400 }
            );
        }

        await db.role.delete({
            where: { id },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.ROLE_DELETE || "ROLE_DELETE",
            resource: "Role",
            resourceId: id,
            details: { name: role.name, code: role.code },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting role:", error);
        return NextResponse.json(
            { error: "Failed to delete role" },
            { status: 500 }
        );
    }
}
