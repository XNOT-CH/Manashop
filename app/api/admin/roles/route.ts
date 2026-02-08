"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึงรายการยศทั้งหมด
export async function GET() {
    try {
        const roles = await db.role.findMany({
            orderBy: [
                { sortOrder: "asc" },
                { createdAt: "asc" },
            ],
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json(
            { error: "Failed to fetch roles" },
            { status: 500 }
        );
    }
}

// POST - สร้างยศใหม่
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code, iconUrl, description, permissions, sortOrder } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Auto-generate code from name if not provided
        const roleCode = code ? code.toUpperCase() : name.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

        // Check if code already exists
        const existingRole = await db.role.findUnique({
            where: { code: roleCode },
        });

        if (existingRole) {
            return NextResponse.json(
                { error: "Role code already exists" },
                { status: 400 }
            );
        }

        const role = await db.role.create({
            data: {
                name,
                code: roleCode,
                iconUrl: iconUrl || null,
                description: description || null,
                permissions: permissions ? JSON.stringify(permissions) : null,
                sortOrder: sortOrder || 0,
                isSystem: false,
            },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.ROLE_CREATE || "ROLE_CREATE",
            resource: "Role",
            resourceId: role.id,
            details: { name, code: roleCode },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error) {
        console.error("Error creating role:", error);
        return NextResponse.json(
            { error: "Failed to create role" },
            { status: 500 }
        );
    }
}
