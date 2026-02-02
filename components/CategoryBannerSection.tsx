import { db } from "@/lib/db";
import { CategoryBannerCard } from "./CategoryBannerCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CategoryBannerType = any;

interface CategoryBannerSectionProps {
    page?: "home" | "products";
}

export async function CategoryBannerSection({ page = "home" }: CategoryBannerSectionProps) {
    // Fetch banners based on page
    const whereClause: Record<string, boolean> = {
        isActive: true,
    };

    if (page === "home") {
        whereClause.showOnHome = true;
    } else if (page === "products") {
        whereClause.showOnProducts = true;
    }

    const banners = await db.categoryBanner.findMany({
        where: whereClause,
        orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
        ],
    });

    if (banners.length === 0) {
        return null;
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    หมวดหมู่สินค้า
                </h2>
                <p className="text-muted-foreground mt-1">
                    เลือกหมวดหมู่ที่คุณสนใจ
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner: CategoryBannerType) => (
                    <CategoryBannerCard
                        key={banner.id}
                        name={banner.name}
                        imageUrl={banner.imageUrl}
                        linkUrl={banner.linkUrl || undefined}
                        productCount={banner.productCount}
                        minPrice={banner.minPrice ? Number(banner.minPrice) : undefined}
                        maxPrice={banner.maxPrice ? Number(banner.maxPrice) : undefined}
                    />
                ))}
            </div>
        </section>
    );
}
