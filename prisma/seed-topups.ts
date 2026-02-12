import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BANKS = ["KBANK", "SCB", "KTB", "BBL", "BAY", "TRUEWALLET", "PROMPTPAY"];

function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    // Find a user to attach topups to
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("❌ ไม่พบ user ในระบบ กรุณาสร้าง user ก่อน");
        return;
    }

    console.log(`📦 ใช้ user: ${user.username} (${user.id})`);

    const topups = [];
    const now = new Date();

    // Generate topups for the last 7 days
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const day = new Date(now);
        day.setDate(now.getDate() - dayOffset);

        // Random number of topups per day (3-8)
        const count = randomBetween(3, 8);

        for (let i = 0; i < count; i++) {
            const hour = randomBetween(8, 22);
            const minute = randomBetween(0, 59);
            const createdAt = new Date(day);
            createdAt.setHours(hour, minute, randomBetween(0, 59), 0);

            // Random amount: 50, 100, 200, 300, 500, 1000
            const amounts = [50, 100, 100, 200, 200, 300, 500, 500, 1000];
            const amount = pickRandom(amounts);

            // Most are APPROVED, some PENDING, few REJECTED
            const statusRoll = Math.random();
            const status =
                statusRoll < 0.75 ? "APPROVED" : statusRoll < 0.9 ? "PENDING" : "REJECTED";

            topups.push({
                userId: user.id,
                amount: amount,
                status,
                senderBank: pickRandom(BANKS),
                senderName: `ผู้โอน ${i + 1}`,
                createdAt,
            });
        }
    }

    // Insert all
    const result = await prisma.topup.createMany({ data: topups });
    console.log(`✅ เพิ่มข้อมูลจำลอง ${result.count} รายการสำเร็จ!`);

    // Summary
    const approved = topups.filter((t) => t.status === "APPROVED");
    const totalApproved = approved.reduce((s, t) => s + t.amount, 0);
    console.log(`   - APPROVED: ${approved.length} รายการ (฿${totalApproved.toLocaleString()})`);
    console.log(`   - PENDING: ${topups.filter((t) => t.status === "PENDING").length} รายการ`);
    console.log(`   - REJECTED: ${topups.filter((t) => t.status === "REJECTED").length} รายการ`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
