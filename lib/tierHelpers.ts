// Tier calculation helpers

export interface TierConfig {
    tiers: {
        bronze: { min: number; max: number; name: string; color: string; icon: string };
        silver: { min: number; max: number; name: string; color: string; icon: string };
        gold: { min: number; max: number; name: string; color: string; icon: string };
        diamond: { min: number; max: number; name: string; color: string; icon: string };
        legend: { min: number; name: string; color: string; icon: string };
    };
    borders: {
        gold: number;
        platinum: number;
    };
}

export interface UserTier {
    name: string;
    displayName: string;
    color: string;
    icon: string;
    level: number;
}

export interface BorderTier {
    name: "none" | "gold" | "platinum";
    style: string;
}

/**
 * Get user's VIP tier based on total top-up amount
 */
export function getUserTier(totalTopup: number, config: TierConfig): UserTier | null {
    const { tiers } = config;

    if (totalTopup >= tiers.legend.min) {
        return {
            name: "legend",
            displayName: tiers.legend.name,
            color: tiers.legend.color,
            icon: tiers.legend.icon,
            level: 5,
        };
    }

    if (totalTopup >= tiers.diamond.min && totalTopup <= tiers.diamond.max) {
        return {
            name: "diamond",
            displayName: tiers.diamond.name,
            color: tiers.diamond.color,
            icon: tiers.diamond.icon,
            level: 4,
        };
    }

    if (totalTopup >= tiers.gold.min && totalTopup <= tiers.gold.max) {
        return {
            name: "gold",
            displayName: tiers.gold.name,
            color: tiers.gold.color,
            icon: tiers.gold.icon,
            level: 3,
        };
    }

    if (totalTopup >= tiers.silver.min && totalTopup <= tiers.silver.max) {
        return {
            name: "silver",
            displayName: tiers.silver.name,
            color: tiers.silver.color,
            icon: tiers.silver.icon,
            level: 2,
        };
    }

    if (totalTopup >= tiers.bronze.min && totalTopup <= tiers.bronze.max) {
        return {
            name: "bronze",
            displayName: tiers.bronze.name,
            color: tiers.bronze.color,
            icon: tiers.bronze.icon,
            level: 1,
        };
    }

    return null;
}

/**
 * Get border tier based on lifetime points
 */
export function getBorderTier(lifetimePoints: number, config: TierConfig): BorderTier {
    const { borders } = config;

    if (lifetimePoints >= borders.platinum) {
        return {
            name: "platinum",
            style: "ring-2 ring-purple-400 ring-offset-2",
        };
    }

    if (lifetimePoints >= borders.gold) {
        return {
            name: "gold",
            style: "ring-2 ring-amber-400 ring-offset-2",
        };
    }

    return {
        name: "none",
        style: "",
    };
}

/**
 * Check if user is a newbie (< 7 days old)
 */
export function isNewbie(createdAt: Date | string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 7;
}

/**
 * Get special badges for a user
 */
export interface SpecialBadge {
    name: string;
    displayName: string;
    color: string;
    icon: string;
}

export function getSpecialBadges(user: {
    createdAt: Date | string;
    role?: string;
    isVerified?: boolean;
    isInfluencer?: boolean;
}): SpecialBadge[] {
    const badges: SpecialBadge[] = [];

    // Admin/Staff badge
    if (user.role === "ADMIN") {
        badges.push({
            name: "admin",
            displayName: "แอดมิน",
            color: "#F44336",
            icon: "🛡️",
        });
    }

    // Verified badge
    if (user.isVerified) {
        badges.push({
            name: "verified",
            displayName: "ยืนยันตัวตน",
            color: "#1DA1F2",
            icon: "✅",
        });
    }

    // Influencer badge
    if (user.isInfluencer) {
        badges.push({
            name: "influencer",
            displayName: "ผู้มีอิทธิพล",
            color: "#E91E63",
            icon: "🎮",
        });
    }

    // Newbie badge (lowest priority)
    if (isNewbie(user.createdAt)) {
        badges.push({
            name: "newbie",
            displayName: "สมาชิกใหม่",
            color: "#4CAF50",
            icon: "🌟",
        });
    }

    return badges;
}

/**
 * Get progress to next tier (percentage)
 */
export function getTierProgress(totalTopup: number, config: TierConfig): {
    current: UserTier | null;
    next: UserTier | null;
    progress: number;
} {
    const currentTier = getUserTier(totalTopup, config);

    if (!currentTier) {
        // Below bronze threshold
        return {
            current: null,
            next: {
                name: "bronze",
                displayName: config.tiers.bronze.name,
                color: config.tiers.bronze.color,
                icon: config.tiers.bronze.icon,
                level: 1,
            },
            progress: (totalTopup / config.tiers.bronze.min) * 100,
        };
    }

    if (currentTier.name === "legend") {
        // Already at max tier
        return {
            current: currentTier,
            next: null,
            progress: 100,
        };
    }

    // Calculate next tier
    const tierOrder = ["bronze", "silver", "gold", "diamond", "legend"];
    const currentIndex = tierOrder.indexOf(currentTier.name);
    const nextTierName = tierOrder[currentIndex + 1];
    const nextTierData = config.tiers[nextTierName as keyof TierConfig["tiers"]];

    const progress =
        ((totalTopup - config.tiers[currentTier.name as keyof TierConfig["tiers"]].min) /
            (nextTierData.min - config.tiers[currentTier.name as keyof TierConfig["tiers"]].min)) * 100;

    return {
        current: currentTier,
        next: {
            name: nextTierName,
            displayName: nextTierData.name,
            color: nextTierData.color,
            icon: nextTierData.icon,
            level: currentIndex + 2,
        },
        progress: Math.min(progress, 100),
    };
}
