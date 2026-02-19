import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BANKS = ["KBANK", "SCB", "KTB", "BBL", "BAY", "TRUEWALLET", "PROMPTPAY"];
const THAI_FIRST_NAMES = ["สมชาย", "สมหญิง", "วิชัย", "ปิยะ", "กานต์", "ณัฐ", "พิมพ์", "อรุณ", "จิรา", "ธนา"];
const THAI_LAST_NAMES = ["สุขใจ", "รักดี", "มั่นคง", "ใจดี", "สว่าง", "พัฒนา", "เจริญ", "สมบูรณ์", "ศรีสุข", "วงศ์ดี"];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log("🚀 เริ่มเพิ่มข้อมูลทดลอง...\n");

    // --- 1. สร้างลูกค้าทดสอบ 5 คน ---
    const hashedPassword = await bcrypt.hash("Test1234!", 10);

    const testUsers = [
        {
            username: "somchai01",
            name: "สมชาย สุขใจ",
            email: "somchai@test.com",
            password: hashedPassword,
            role: "USER",
            phone: "0812345678",
            firstName: "สมชาย",
            lastName: "สุขใจ",
            firstNameEn: "Somchai",
            lastNameEn: "Sukjai",
        },
        {
            username: "somying02",
            name: "สมหญิง รักดี",
            email: "somying@test.com",
            password: hashedPassword,
            role: "USER",
            phone: "0823456789",
            firstName: "สมหญิง",
            lastName: "รักดี",
            firstNameEn: "Somying",
            lastNameEn: "Rakdee",
        },
        {
            username: "wichai03",
            name: "วิชัย มั่นคง",
            email: "wichai@test.com",
            password: hashedPassword,
            role: "USER",
            phone: "0834567890",
            firstName: "วิชัย",
            lastName: "มั่นคง",
            firstNameEn: "Wichai",
            lastNameEn: "Munkong",
        },
        {
            username: "piya04",
            name: "ปิยะ ใจดี",
            email: "piya@test.com",
            password: hashedPassword,
            role: "USER",
            phone: "0845678901",
            firstName: "ปิยะ",
            lastName: "ใจดี",
            firstNameEn: "Piya",
            lastNameEn: "Jaidee",
        },
        {
            username: "kanit05",
            name: "กานต์ สว่าง",
            email: "kanit@test.com",
            password: hashedPassword,
            role: "USER",
            phone: "0856789012",
            firstName: "กานต์",
            lastName: "สว่าง",
            firstNameEn: "Kanit",
            lastNameEn: "Sawang",
        },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
        // Skip if user already exists
        const existing = await prisma.user.findUnique({ where: { username: userData.username } });
        if (existing) {
            console.log(`   ⏭️  ข้ามผู้ใช้ ${userData.username} (มีอยู่แล้ว)`);
            createdUsers.push(existing);
            continue;
        }
        const user = await prisma.user.create({ data: userData });
        console.log(`   ✅ สร้างผู้ใช้ ${user.username} (${user.name})`);
        createdUsers.push(user);
    }
    console.log(`\n👥 ผู้ใช้ทั้งหมด: ${createdUsers.length} คน\n`);

    // --- 2. สร้าง Topup ข้อมูลทดลอง รวม ~20,000 บาท (APPROVED) ---
    const topups: Prisma.TopupCreateManyInput[] = [];
    const now = new Date();

    // กำหนดยอดเป้าหมายให้แต่ละ user (รวมได้ ~20,000)
    const targetAmounts = [5000, 4500, 4000, 3500, 3000]; // รวม = 20,000

    for (let userIdx = 0; userIdx < createdUsers.length; userIdx++) {
        const user = createdUsers[userIdx];
        const target = targetAmounts[userIdx];
        let remaining = target;

        // กระจายใน 7 วันที่ผ่านมา
        for (let dayOffset = 6; dayOffset >= 0 && remaining > 0; dayOffset--) {
            const day = new Date(now);
            day.setDate(now.getDate() - dayOffset);

            // 1-3 topups ต่อวัน
            const count = randomBetween(1, 3);
            for (let i = 0; i < count && remaining > 0; i++) {
                const possibleAmounts = [100, 200, 300, 500, 1000].filter((a) => a <= remaining);
                if (possibleAmounts.length === 0) break;

                const amount = pickRandom(possibleAmounts);
                remaining -= amount;

                const hour = randomBetween(8, 22);
                const minute = randomBetween(0, 59);
                const createdAt = new Date(day);
                createdAt.setHours(hour, minute, randomBetween(0, 59), 0);

                topups.push({
                    userId: user.id,
                    amount,
                    status: "APPROVED",
                    senderBank: pickRandom(BANKS),
                    senderName: `${pickRandom(THAI_FIRST_NAMES)} ${pickRandom(THAI_LAST_NAMES)}`,
                    receiverBank: "KBANK",
                    receiverName: "ManaShop",
                    transactionRef: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    createdAt,
                });
            }
        }

        // เพิ่ม PENDING/REJECTED สักเล็กน้อยให้สมจริง
        for (let i = 0; i < 2; i++) {
            const day = new Date(now);
            day.setDate(now.getDate() - randomBetween(0, 6));
            day.setHours(randomBetween(8, 22), randomBetween(0, 59), 0, 0);

            topups.push({
                userId: user.id,
                amount: pickRandom([100, 200, 500]),
                status: i === 0 ? "PENDING" : "REJECTED",
                senderBank: pickRandom(BANKS),
                senderName: `${pickRandom(THAI_FIRST_NAMES)} ${pickRandom(THAI_LAST_NAMES)}`,
                receiverBank: "KBANK",
                receiverName: "ManaShop",
                transactionRef: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: day,
            });
        }
    }

    // Insert topups
    const result = await prisma.topup.createMany({ data: topups });
    console.log(`💰 เพิ่ม Topup ${result.count} รายการ`);

    // --- 3. อัปเดต creditBalance & totalTopup ของแต่ละ user ---
    for (let userIdx = 0; userIdx < createdUsers.length; userIdx++) {
        const user = createdUsers[userIdx];
        const userApproved = topups
            .filter((t) => t.userId === user.id && t.status === "APPROVED")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                creditBalance: userApproved,
                totalTopup: userApproved,
            },
        });
        console.log(`   📊 ${user.username}: ยอดเติมสำเร็จ ฿${userApproved.toLocaleString()}`);
    }

    // --- สรุป ---
    const totalApproved = topups
        .filter((t) => t.status === "APPROVED")
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalPending = topups.filter((t) => t.status === "PENDING").length;
    const totalRejected = topups.filter((t) => t.status === "REJECTED").length;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 สรุป:`);
    console.log(`   ✅ APPROVED: ${topups.filter((t) => t.status === "APPROVED").length} รายการ (฿${totalApproved.toLocaleString()})`);
    console.log(`   ⏳ PENDING: ${totalPending} รายการ`);
    console.log(`   ❌ REJECTED: ${totalRejected} รายการ`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n🎉 เสร็จสิ้น!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
