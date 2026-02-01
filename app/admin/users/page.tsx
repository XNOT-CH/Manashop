import { db } from "@/lib/db";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
    // Fetch all users from database
    const users = await db.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            image: true,
            role: true,
            creditBalance: true,
            totalTopup: true,
            pointBalance: true,
            lifetimePoints: true,
            createdAt: true,
        },
    });

    // Convert Prisma Decimal to string for serialization
    const serializedUsers = users.map((user) => ({
        ...user,
        creditBalance: user.creditBalance.toString(),
        totalTopup: user.totalTopup.toString(),
        createdAt: user.createdAt.toISOString(),
    }));

    return <AdminUsersClient initialUsers={serializedUsers} />;
}
