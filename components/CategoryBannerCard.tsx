"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryBannerCardProps {
    name: string;
    imageUrl: string;
    linkUrl?: string;
    productCount?: number;
    minPrice?: number;
    maxPrice?: number;
}

export function CategoryBannerCard({
    name,
    imageUrl,
    linkUrl = "#",
    productCount = 0,
    minPrice,
    maxPrice,
}: CategoryBannerCardProps) {
    // Format price
    const formatPrice = (price?: number) => {
        if (price === undefined || price === null) return null;
        return `฿${price.toLocaleString()}`;
    };

    const priceRange =
        minPrice !== undefined && maxPrice !== undefined
            ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
            : minPrice !== undefined
                ? `ตั้งแต่ ${formatPrice(minPrice)}`
                : maxPrice !== undefined
                    ? `ถึง ${formatPrice(maxPrice)}`
                    : null;

    return (
        <Link
            href={linkUrl}
            className="group block rounded-2xl overflow-hidden bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
            {/* Image Container with exact 1640:500 aspect ratio */}
            <div className="relative aspect-[1640/500] overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1640px"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Category Name - Bottom Left */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                        {name}
                    </h3>
                    {productCount > 0 && (
                        <p className="text-sm sm:text-base text-white/80 mt-1">
                            {productCount} สินค้า
                        </p>
                    )}
                </div>
            </div>

            {/* Footer Area */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-card">
                {/* Price Range - Left */}
                <div>
                    {priceRange ? (
                        <span className="text-sm sm:text-base font-medium text-foreground">
                            {priceRange}
                        </span>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            ดูสินค้าทั้งหมด
                        </span>
                    )}
                </div>

                {/* Arrow Icon - Right */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary transition-colors duration-300">
                    <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
            </div>
        </Link>
    );
}
