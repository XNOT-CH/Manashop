import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductActions } from "@/components/ProductActions";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { ShareButtons } from "@/components/ShareButtons";
import {
    Zap,
    TriangleAlert,
    Shield,
    Clock,
    CheckCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { getStockCount } from "@/lib/stock";

interface ProductDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
    params,
}: ProductDetailPageProps) {
    const { id } = await params;

    // Fetch product from database
    const product = await db.product.findUnique({
        where: { id },
    });

    // If product not found, show 404
    if (!product) {
        notFound();
    }

    const isSold = Boolean(product.isSold);
    const price = Number(product.price);
    const stockCount = getStockCount(product.secretData || "", product.stockSeparator || "newline");

    return (
        <div className="min-h-screen bg-background animate-page-enter">
            <main className="py-6 sm:py-8 px-4 sm:px-6">
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[
                        { label: "ร้านค้า", href: "/shop" },
                        { label: product.name },
                    ]}
                    className="mb-6"
                />
                {/* Product Detail Grid */}
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Left Column - Gallery */}
                    <ProductGallery
                        mainImage={product.imageUrl || "/placeholder.jpg"}
                    />

                    {/* Right Column - Product Info */}
                    <div className="flex flex-col gap-6">
                        {/* Category & Title */}
                        <div>
                            <Badge variant="outline" className="mb-3">
                                {product.category}
                            </Badge>
                            <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
                                {product.name}
                            </h1>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-primary">
                                ฿{price.toLocaleString()}
                            </span>
                            {!isSold && stockCount > 0 && (
                                <Badge className="bg-green-600 hover:bg-green-600">
                                    พร้อมขาย
                                </Badge>
                            )}
                            {(isSold || stockCount === 0) && (
                                <Badge variant="destructive">สินค้าหมด</Badge>
                            )}
                            {stockCount > 0 && (
                                <Badge variant="outline" className="text-muted-foreground">
                                    คงเหลือ {stockCount} ชิ้น
                                </Badge>
                            )}
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                ส่งทันที
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                ปลอดภัย
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                ซัพพอร์ต 24/7
                            </div>
                        </div>

                        {/* Warning Alert */}
                        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                            <TriangleAlert className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 dark:text-amber-200">
                                ข้อควรระวัง
                            </AlertTitle>
                            <AlertDescription className="text-amber-700 dark:text-amber-300">
                                สินค้าประเภท Digital ID ซื้อแล้วไม่รับเปลี่ยนคืน
                                กรุณาตรวจสอบรายละเอียดก่อนชำระเงิน
                                และเปลี่ยนรหัสผ่านทันทีหลังได้รับสินค้า
                            </AlertDescription>
                        </Alert>

                        {/* Description */}
                        {product.description && (
                            <div className="rounded-xl bg-card p-6 border border-border">
                                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    รายละเอียดสินค้า
                                </h2>
                                <div className="prose prose-slate max-w-none">
                                    <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-auto pt-4">
                            <ProductActions
                                product={{
                                    id: product.id,
                                    name: product.name,
                                    price: price,
                                    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
                                    imageUrl: product.imageUrl,
                                    category: product.category,
                                }}
                                disabled={isSold || stockCount === 0}
                                maxQuantity={stockCount}
                            />
                        </div>

                        {/* Share Buttons */}
                        <ShareButtons title={product.name} className="border-t border-border pt-6" />

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-6 border-t border-border pt-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                ชำระปลอดภัย
                            </div>
                            <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4" />
                                ส่งอัตโนมัติ
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                ผู้ขายยืนยัน
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
