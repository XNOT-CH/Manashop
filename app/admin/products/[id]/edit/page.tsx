"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Pencil, Gem, Banknote } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        discountPrice: "",
        image: "",
        category: "",
        description: "",
        secretData: "",
        currency: "THB",
    });

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
                        price: product.price?.toString() || "",
                        discountPrice: product.discountPrice?.toString() || "",
                        image: product.imageUrl || "",
                        category: product.category || "",
                        description: product.description || "",
                        secretData: product.secretData || "",
                        currency: product.currency || "THB",
                    });
                } else {
                    toast.error("ไม่พบสินค้า");
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("🎉 แก้ไขสินค้าสำเร็จ!", {
                    description: "ข้อมูลสินค้าถูกอัพเดทเรียบร้อยแล้ว",
                });
                router.push("/admin/products");
            } else {
                toast.error("เกิดข้อผิดพลาด", {
                    description: data.message,
                });
            }
        } catch (error) {
            toast.error("ไม่สามารถแก้ไขสินค้าได้", {
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
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
                <ArrowLeft className="h-4 w-4" />
                กลับไปรายการสินค้า
            </Link>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Pencil className="h-6 w-6 text-indigo-600" />
                        แก้ไขสินค้า ✏️
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">ชื่อสินค้า *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="เช่น Valorant ID (Diamond Rank)"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Currency Type */}
                        <div className="space-y-3">
                            <Label>ประเภทสกุลเงิน *</Label>
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
                            {formData.currency === "POINT" && (
                                <p className="text-xs text-purple-600">
                                    💎 สินค้านี้จะซื้อได้ด้วย Point เท่านั้น
                                </p>
                            )}
                        </div>

                        {/* Price & Discount Row */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="flex items-center gap-2">
                                    {formData.currency === "POINT" ? (
                                        <><Gem className="h-4 w-4 text-purple-600" /> ราคา (Point) *</>
                                    ) : (
                                        <>ราคาเต็ม (฿) *</>
                                    )}
                                </Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    placeholder={formData.currency === "POINT" ? "เช่น 100" : "เช่น 1500"}
                                    min="0"
                                    step={formData.currency === "POINT" ? "1" : "0.01"}
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    className={formData.currency === "POINT" ? "border-purple-300 focus:border-purple-500" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discountPrice" className="flex items-center gap-2">
                                    <span className="text-red-500">🎁</span>
                                    ราคาลด {formData.currency === "POINT" ? "(Point)" : "(฿)"}
                                </Label>
                                <Input
                                    id="discountPrice"
                                    name="discountPrice"
                                    type="number"
                                    placeholder="เว้นว่างเดือลลธรรมดาลด"
                                    min="0"
                                    step={formData.currency === "POINT" ? "1" : "0.01"}
                                    value={formData.discountPrice}
                                    onChange={handleChange}
                                    className="border-red-200 focus:border-red-400"
                                />
                                <p className="text-xs text-muted-foreground">
                                    หากกรอกราคานี้ สินค้าจะแสดงใน "สินค้าลดราคา"
                                </p>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">หมวดหมู่ *</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="เช่น ROV, Valorant, Genshin"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="image">URL รูปภาพ</Label>
                            <Input
                                id="image"
                                name="image"
                                placeholder="https://images.unsplash.com/..."
                                value={formData.image}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">รายละเอียด</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="รายละเอียดสินค้า เช่น แรงค์, สกินที่มี, Agent ที่ปลดล็อค..."
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Secret Data (Highlighted) */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="secretData"
                                className="flex items-center gap-2 text-amber-700"
                            >
                                🔐 ข้อมูลลับ (ID/Password) *
                            </Label>
                            <Textarea
                                id="secretData"
                                name="secretData"
                                placeholder="ID: username123&#10;Pass: password456"
                                rows={3}
                                value={formData.secretData}
                                onChange={handleChange}
                                required
                                className="border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-500"
                            />
                            <p className="text-xs text-amber-600">
                                ⚠️ ข้อมูลนี้จะแสดงให้ผู้ซื้อเห็นหลังชำระเงินสำเร็จ
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
