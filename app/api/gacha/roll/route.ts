import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, users, gachaMachines, gachaRewards, gachaRollLogs, orders, products } from "@/lib/db";
import { eq, and, or, isNotNull, isNull, gte, lte, inArray, sql, count } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/encryption";
import { takeFirstStock } from "@/lib/stock";
import {
    buildGrid, getValidLSelectors, getValidRSelectorsFor, getIntersectionTile,
    type GachaProductLite, type GachaTier,
} from "@/lib/gachaGrid";
import crypto from "node:crypto";

const COOKIE_NAME = "gacha_l_pending";
const COOKIE_TTL = 300;

function toMySQLDatetime(d: Date) {
    return d.toISOString().slice(0, 19).replace("T", " ");
}

function getDayRange(date: Date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    return { start: toMySQLDatetime(start), end: toMySQLDatetime(end) };
}

async function fetchRewards(machineId: string | null) {
    const whereCondition = and(
        eq(gachaRewards.isActive, true),
        machineId ? eq(gachaRewards.gachaMachineId, machineId) : isNull(gachaRewards.gachaMachineId),
        or(
            and(eq(gachaRewards.rewardType, "PRODUCT"), isNotNull(gachaRewards.productId)),
            and(inArray(gachaRewards.rewardType, ["CREDIT", "POINT"]), isNotNull(gachaRewards.rewardName), isNotNull(gachaRewards.rewardAmount))
        )
    );
    return db.query.gachaRewards.findMany({
        where: whereCondition,
        with: { product: { columns: { id: true, name: true, price: true, imageUrl: true, secretData: true, stockSeparator: true, isSold: true, orderId: true } } },
    });
}

async function fetchTieredProducts(machineId: string | null) {
    const allRewards = await fetchRewards(machineId);
    type RewardRow = (typeof allRewards)[number];
    const tieredProducts: GachaProductLite[] = allRewards
        .filter((r: RewardRow) => r.rewardType === "PRODUCT" ? r.product && !r.product.isSold : (r.rewardName && r.rewardAmount))
        .map((r: RewardRow) => r.rewardType === "PRODUCT" && r.product
            ? { id: r.product.id, name: r.product.name, price: Number(r.product.price), imageUrl: r.product.imageUrl, tier: (r.tier as GachaTier) ?? "common" }
            : { id: `reward:${r.id}`, name: r.rewardName ?? (r.rewardType === "CREDIT" ? "เครดิต" : "พอยต์"), price: Number(r.rewardAmount ?? 0), imageUrl: r.rewardImageUrl ?? null, tier: (r.tier as GachaTier) ?? "common" }
        );
    return { allRewards, tieredProducts };
}

async function fetchUserOrError(userId: string, costType: string, costAmount: number) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, creditBalance: true, pointBalance: true },
    });
    if (!user) return { error: "ไม่พบผู้ใช้งาน", status: 404 };
    if (costType === "CREDIT" && costAmount > 0 && Number(user.creditBalance) < costAmount)
        return { error: "เครดิตไม่เพียงพอ", status: 400 };
    if (costType === "POINT" && costAmount > 0 && (user.pointBalance ?? 0) < costAmount)
        return { error: "พอยต์ไม่เพียงพอ", status: 400 };
    return { user };
}

async function handleSpin1(userId: string, machineId: string | null, costType: string, costAmount: number, dailySpinLimit: number) {
    const userRes = await fetchUserOrError(userId, costType, costAmount);
    if ('error' in userRes) return { error: userRes.error, status: userRes.status };

    if (dailySpinLimit > 0) {
        await checkDailySpinLimit(userId, dailySpinLimit);
    }

    const { tieredProducts } = await fetchTieredProducts(machineId);

    if (tieredProducts.length === 0)
        return { error: "ไม่มีรางวัลสำหรับกาชาในขณะนี้", status: 400 };

    const tiles = buildGrid(tieredProducts);
    const validLSelectors = getValidLSelectors(tiles);
    if (validLSelectors.length === 0)
        return { error: "ไม่มีแถวซ้ายที่สุ่มได้", status: 400 };

    const lLabel = validLSelectors[crypto.randomInt(0, validLSelectors.length)];
    const payload = encrypt(JSON.stringify({ userId, lLabel, iat: Date.now() }));
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, payload, { httpOnly: true, maxAge: COOKIE_TTL, path: "/" });
    
    return { data: { lLabel } };
}

async function handleSpin2(userId: string, machineId: string | null, costType: string, costAmount: number, dailySpinLimit: number) {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!rawCookie) return { error: "กรุณากดสุ่มครั้งที่ 1 ก่อน", status: 400 };

    let lLabel: string;
    try {
        const parsed = JSON.parse(decrypt(rawCookie));
        if (parsed.userId !== userId) throw new Error("user mismatch");
        if (Date.now() - parsed.iat > COOKIE_TTL * 1000) throw new Error("expired");
        lLabel = parsed.lLabel;
    } catch {
        cookieStore.delete(COOKIE_NAME);
        return { error: "เซสชันสุ่มหมดอายุ กรุณาเริ่มใหม่", status: 400 };
    }
    cookieStore.delete(COOKIE_NAME);

    const userRes = await fetchUserOrError(userId, costType, costAmount);
    if ('error' in userRes) return { error: userRes.error, status: userRes.status };
    const user = userRes.user;

    if (dailySpinLimit > 0) {
        await checkDailySpinLimit(userId, dailySpinLimit);
    }

    const { allRewards, tieredProducts } = await fetchTieredProducts(machineId);
    if (tieredProducts.length === 0) return { error: "ไม่มีรางวัลสำหรับกาชาในขณะนี้", status: 400 };

    const tiles = buildGrid(tieredProducts);
    const validRSelectors = getValidRSelectorsFor(tiles, lLabel);
    if (validRSelectors.length === 0) return { error: "ไม่มีแถวขวาที่สุ่มได้", status: 400 };

    const rLabel = validRSelectors[crypto.randomInt(0, validRSelectors.length)];
    const selectorLabel = `${lLabel}+${rLabel}`;
    const intersectionTile = getIntersectionTile(tiles, lLabel, rLabel);
    if (!intersectionTile?.product) return { error: "ไม่พบรางวัลที่จุดตัด กรุณาสุ่มใหม่", status: 400 };

    const chosenId = intersectionTile.product.id;
    const rewardMeta = tieredProducts.find((p) => p.id === chosenId);
    const tier: GachaTier = rewardMeta?.tier ?? "common";

    const isCurrencyReward = chosenId.startsWith("reward:");
    if (isCurrencyReward) {
        const rewardRowId = chosenId.replace("reward:", "");
        const chosenRewardRow = allRewards.find((r) => r.id === rewardRowId);
        const rewardType = chosenRewardRow?.rewardType as "CREDIT" | "POINT";
        const rewardAmount = Number(chosenRewardRow?.rewardAmount ?? 0);
        
        await db.transaction(async (tx) => {
            if (costType === "CREDIT" && costAmount > 0) await tx.update(users).set({ creditBalance: sql`creditBalance - ${costAmount}` }).where(eq(users.id, user.id));
            if (costType === "POINT" && costAmount > 0) await tx.update(users).set({ pointBalance: sql`pointBalance - ${costAmount}` }).where(eq(users.id, user.id));
            if (rewardType === "CREDIT" && rewardAmount > 0) await tx.update(users).set({ creditBalance: sql`creditBalance + ${rewardAmount}` }).where(eq(users.id, user.id));
            if (rewardType === "POINT" && rewardAmount > 0) await tx.update(users).set({ pointBalance: sql`pointBalance + ${rewardAmount}` }).where(eq(users.id, user.id));
            await tx.insert(gachaRollLogs).values({
                id: crypto.randomUUID(), userId: user.id, productId: null, rewardName: rewardMeta?.name ?? null,
                rewardImageUrl: rewardMeta?.imageUrl ?? null, tier, selectorLabel, costType, costAmount: String(costAmount), gachaMachineId: machineId,
            });
        });
        
        return { data: { lLabel, rLabel, selectorLabel, tier, orderId: null, product: { id: chosenId, name: rewardMeta?.name ?? "รางวัล", price: rewardMeta?.price ?? 0, imageUrl: rewardMeta?.imageUrl ?? null, tier, rewardType, rewardAmount } } };
    }

    // Product reward
    const result = await db.transaction(async (tx) => {
        const product = await tx.query.products.findFirst({
            where: eq(products.id, chosenId),
            columns: { id: true, name: true, price: true, imageUrl: true, isSold: true, orderId: true, secretData: true, stockSeparator: true },
        });
        if (!product || product.isSold || product.orderId) throw new Error("รางวัลนี้ถูกใช้ไปแล้ว กรุณาสุ่มใหม่");

        const [taken, remainingData] = takeFirstStock(decrypt(product.secretData || ""), product.stockSeparator || "newline");
        if (!taken) throw new Error("สต็อกของรางวัลหมดแล้ว");

        const isLastStock = !remainingData || remainingData.trim().length === 0;
        const orderId = crypto.randomUUID();
        await tx.insert(orders).values({ id: orderId, userId: user.id, totalPrice: String(costAmount), status: "COMPLETED", givenData: encrypt(taken) });

        if (costType === "CREDIT" && costAmount > 0) await tx.update(users).set({ creditBalance: sql`creditBalance - ${costAmount}` }).where(eq(users.id, user.id));
        if (costType === "POINT" && costAmount > 0) await tx.update(users).set({ pointBalance: sql`pointBalance - ${costAmount}` }).where(eq(users.id, user.id));
        await tx.update(products).set({ secretData: isLastStock ? encrypt(taken) : encrypt(remainingData), isSold: isLastStock, orderId }).where(eq(products.id, product.id));
        await tx.insert(gachaRollLogs).values({
            id: crypto.randomUUID(), userId: user.id, productId: product.id, rewardName: product.name,
            rewardImageUrl: product.imageUrl ?? null, tier, selectorLabel, costType, costAmount: String(costAmount), gachaMachineId: machineId,
        });
        
        return { orderId, product: { id: product.id, name: product.name, price: Number(product.price), imageUrl: product.imageUrl, tier } };
    });

    return { data: { lLabel, rLabel, selectorLabel, tier, orderId: result.orderId, product: result.product } };
}

export async function POST(req: Request) {
    const authCheck = await isAuthenticated();
    if (!authCheck.success || !authCheck.userId) {
        return NextResponse.json({ success: false, message: authCheck.error }, { status: 401 });
    }

    let spin = 1;
    let machineId: string | null = null;
    try {
        const body = await req.json();
        spin = Number(body.spin ?? 1);
        machineId = (body.machineId as string | null | undefined) ?? null;
    } catch { /* no body */ }

    try {
        const { isEnabled, costType, costAmount, dailySpinLimit } = await getMachineSettingsOrDefaults(machineId);

        if (!isEnabled) return NextResponse.json({ success: false, message: "ระบบกาชาปิดอยู่ชั่วคราว" }, { status: 400 });

        if (spin === 1) {
            const res = await handleSpin1(authCheck.userId, machineId, costType, costAmount, dailySpinLimit);
            if ('error' in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status || 400 });
            return NextResponse.json({ success: true, data: res.data });
        }

        // SPIN 2
        const res = await handleSpin2(authCheck.userId, machineId, costType, costAmount, dailySpinLimit);
        if ('error' in res) return NextResponse.json({ success: false, message: res.error }, { status: res.status || 400 });
        return NextResponse.json({ success: true, data: res.data });

    } catch (e) {
        const error = e as Error;
        if (["ตู้กาชานี้ปิดอยู่ชั่วคราว", "ระบบกาชาปิดอยู่ชั่วคราว", "คุณสุ่มครบ", "ไม่พบตู้กาชา"].some((m) => error.message?.includes(m))) {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}

async function getMachineSettingsOrDefaults(machineId: string | null) {
    if (machineId) {
        const machine = await db.query.gachaMachines.findFirst({
            where: eq(gachaMachines.id, machineId),
            columns: { isEnabled: true, isActive: true, costType: true, costAmount: true, dailySpinLimit: true },
        });
        if (!machine) throw new Error("ไม่พบตู้กาชา");
        if (!machine.isActive) throw new Error("ตู้กาชานี้ปิดอยู่ชั่วคราว");
        return { isEnabled: machine.isEnabled ?? true, costType: machine.costType, costAmount: Number(machine.costAmount ?? 0), dailySpinLimit: machine.dailySpinLimit ?? 0 };
    }
    const settings = await db.query.gachaSettings.findFirst().catch(() => null);
    return {
        isEnabled: settings?.isEnabled ?? true,
        costType: settings?.costType ?? "FREE",
        costAmount: Number(settings?.costAmount ?? 0),
        dailySpinLimit: settings?.dailySpinLimit ?? 0,
    };
}

async function checkDailySpinLimit(userId: string, dailySpinLimit: number) {
    const { start, end } = getDayRange(new Date());
    const [{ count: todayCount }] = await db.select({ count: count() }).from(gachaRollLogs)
        .where(and(eq(gachaRollLogs.userId, userId), gte(gachaRollLogs.createdAt, start), lte(gachaRollLogs.createdAt, end)));
    if (Number(todayCount) >= dailySpinLimit)
        throw new Error(`คุณสุ่มครบ ${dailySpinLimit} ครั้ง/วันแล้ว`);
}
