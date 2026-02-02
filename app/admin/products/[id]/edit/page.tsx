"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Pencil, Gem, Banknote, Percent, Tag } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CategoryBanner {
    id: string;
    name: string;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [categories, setCategories] = useState<CategoryBanner[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        image: "",
        description: "",
        notes: "",
        purchaseNotes: "",
        category: "",
        categoryBannerId: "",
        price: "",
        discountType: "FIXED",
        discountValue: "",
        discountPrice: "",
        currency: "THB",
        purchaseLimit: "0",
        secretData: "",
    });

    // Fetch category banners
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/admin/category-banners?active=true");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch product data on mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${productId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const product = data.data;
                    setFormData({
                        title: product.name || "",
                        image: product.imageUrl || "",
                        description: product.description || "",
                        notes: product.notes || "",
                        purchaseNotes: product.purchaseNotes || "",
                        category: product.category || "",
                        categoryBannerId: product.categoryBannerId || "",
                        price: product.price?.toString() || "",
                        discountType: product.discountType || "FIXED",
                        discountValue: product.discountValue?.toString() || "",
                        discountPrice: product.discountPrice?.toString() || "",
                        currency: product.currency || "THB",
                        purchaseLimit: product.purchaseLimit?.toString() || "0",
                        secretData: product.secretData || "",
                    });
                } else {
                    toast.error("ไม่พบข้อมูลสินค้า");
                    router.push("/admin/products");
                }
            } catch (error) {
                toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
                router.push("/admin/products");
            } finally {
                setIsFetching(false);
            }
        };

        fetchProduct();
    }, [productId, router]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Calculate discount price based on type and value
    const calculateDiscountPrice = () => {
        const price = parseFloat(formData.price);
        const discountValue = parseFloat(formData.discountValue);

        if (isNaN(price) || isNaN(discountValue) || discountValue <= 0) {
            return null;
        }

        if (formData.discountType === "PERCENT") {
            return price - (price * discountValue / 100);
        } else {
            return price - discountValue;
        }
    };

    const discountPrice = calculateDiscountPrice();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                discountPrice: discountPrice && discountPrice > 0 ? discountPrice : null,
            };

            const response = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("บันทึกข้อมูลสำเร็จ", {
                    description: "ระบบได้อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว",
                });
                router.push("/admin/products");
            } else {
                toast.error("ไม่สามารถบันทึกข้อมูลได้", {
                    description: data.message,
                });
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด", {
                description: "กรุณาลองใหม่อีกครั้ง",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Back Button */}
            <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                กลับไปรายการสินค้า
            </Link>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Pencil className="h-6 w-6 text-primary" />
                        แก้ไขข้อมูลสินค้า
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="image">ลิงก์รูปภาพสินค้า (URL)</Label>
                            <Input
                                id="image"
                                name="image"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                กรุณาระบุ URL ของรูปภาพสินค้าที่ต้องการแสดงผล
                            </p>
                        </div>

                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="title">ชื่อสินค้า *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="กรุณาระบุชื่อสินค้า"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">รายละเอียดสินค้า</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="กรุณาระบุรายละเอียดสินค้า เช่น คุณสมบัติ ระดับ สกิน ฯลฯ"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">หมายเหตุ</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="ข้อมูลเพิ่มเติมสำหรับสินค้านี้ (แสดงผลในหน้ารายละเอียดสินค้า)"
                                rows={2}
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Purchase Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="purchaseNotes" className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-orange-500" />
                                หมายเหตุสำหรับการสั่งซื้อ
                            </Label>
                            <Textarea
                                id="purchaseNotes"
                                name="purchaseNotes"
                                placeholder="ข้อความแจ้งเตือนที่จะแสดงผลเมื่อลูกค้ากดสั่งซื้อสินค้า (เช่น ข้อควรทราบ ขั้นตอนการรับสินค้า)"
                                rows={2}
                                value={formData.purchaseNotes}
                                onChange={handleChange}
                                className="border-orange-200 focus:border-orange-400"
                            />
                            <p className="text-xs text-muted-foreground">
                                ข้อความนี้จะแสดงผลให้ลูกค้าทราบก่อนทำการยืนยันคำสั่งซื้อ
                            </p>
                        </div>

                        {/* Category Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium">หมวดหมู่สินค้า</h3>

                            {/* Category Text */}
                            <div className="space-y-2">
                                <Label htmlFor="category">ประเภทสินค้า *</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    placeholder="ระบุประเภท เช่น ROV, Valorant, Genshin Impact"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Category Banner Link */}
                            <div className="space-y-2">
                                <Label htmlFor="categoryBannerId">เชื่อมโยงกับหมวดหมู่แบนเนอร์ (ไม่บังคับ)</Label>
                                <Select
                                    value={formData.categoryBannerId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, categoryBannerId: value === "none" ? "" : value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- เลือกหมวดหมู่ (ไม่บังคับ) --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">ไม่เชื่อมโยงกับหมวดหมู่ใด</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    หากเลือกหมวดหมู่ สินค้าจะแสดงผลในหน้าหมวดหมู่ที่เลือกด้วย
                                </p>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium">ราคาและส่วนลด</h3>

                            {/* Currency Type */}
                            <div className="space-y-3">
                                <Label>สกุลเงิน *</Label>
                                <RadioGroup
                                    value={formData.currency}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, currency: value }))
                                    }
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="THB" id="currency-thb" />
                                        <Label htmlFor="currency-thb" className="flex items-center gap-2 cursor-pointer">
                                            <Banknote className="h-4 w-4 text-green-600" />
                                            บาท (THB)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="POINT" id="currency-point" />
                                        <Label htmlFor="currency-point" className="flex items-center gap-2 cursor-pointer">
                                            <Gem className="h-4 w-4 text-purple-600" />
                                            พอยท์ (POINT)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor="price" className="flex items-center gap-2">
                                    {formData.currency === "POINT" ? (
                                        <><Gem className="h-4 w-4 text-purple-600" /> ราคา (พอยท์) *</>
                                    ) : (
                                        <>ราคาเต็ม (บาท) *</>
                                    )}
                                </Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    step={formData.currency === "POINT" ? "1" : "0.01"}
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    className={formData.currency === "POINT" ? "border-purple-300 focus:border-purple-500" : ""}
                                />
                            </div>

                            {/* Discount Section */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="discountType">ประเภทส่วนลด</Label>
                                    <Select
                                        value={formData.discountType}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, discountType: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIXED">
                                                <span className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4" />
                                                    ลดเป็นจำนวนเงิน (บาท)
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="PERCENT">
                                                <span className="flex items-center gap-2">
                                                    <Percent className="h-4 w-4" />
                                                    ลดเป็นเปอร์เซ็นต์ (%)
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountValue">
                                        มูลค่าส่วนลด {formData.discountType === "PERCENT" ? "(%)" : "(บาท)"}
                                    </Label>
                                    <Input
                                        id="discountValue"
                                        name="discountValue"
                                        type="number"
                                        placeholder="เว้นว่างถ้าไม่มีส่วนลด"
                                        min="0"
                                        step="0.01"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className="border-red-200 focus:border-red-400"
                                    />
                                </div>
                            </div>

                            {/* Discount Preview */}
                            {discountPrice !== null && discountPrice > 0 && (
                                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        💰 ราคาหลังหักส่วนลด: <span className="font-bold text-lg">{discountPrice.toLocaleString()} {formData.currency === "POINT" ? "พอยท์" : "บาท"}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Purchase Limit */}
                        <div className="space-y-2">
                            <Label htmlFor="purchaseLimit">จำกัดจำนวนการซื้อต่อบัญชี</Label>
                            <Input
                                id="purchaseLimit"
                                name="purchaseLimit"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="1"
                                value={formData.purchaseLimit}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                กรุณาระบุจำนวนสูงสุดที่ลูกค้าแต่ละรายสามารถซื้อได้ (ระบุ 0 หมายถึงไม่จำกัดจำนวน)
                            </p>
                        </div>

                        {/* Secret Data */}
                        <div className="space-y-2 border-t pt-4">
                            <Label
                                htmlFor="secretData"
                                className="flex items-center gap-2 text-amber-700 dark:text-amber-400"
                            >
                                🔐 ข้อมูลลับสำหรับส่งมอบ (ID/รหัสผ่าน) *
                            </Label>
                            <Textarea
                                id="secretData"
                                name="secretData"
                                placeholder="ID: ชื่อผู้ใช้&#10;รหัสผ่าน: รหัสผ่านของบัญชี"
                                rows={3}
                                value={formData.secretData}
                                onChange={handleChange}
                                required
                                className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 focus:border-amber-500 focus:ring-amber-500"
                            />
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ ข้อมูลนี้จะแสดงผลให้ลูกค้าทราบหลังจากชำระเงินสำเร็จเท่านั้น
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                "บันทึกการเปลี่ยนแปลง"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
