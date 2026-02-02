"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Shield, Gem, Banknote, Percent, ChevronDown, Settings2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

interface CategoryBanner {
    id: string;
    name: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryBanner[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
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

            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("สร้างสินค้าสำเร็จ");
                router.push("/admin/products");
            } else {
                toast.error("ไม่สามารถสร้างสินค้าได้", {
                    description: data.message,
                });
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            {/* Back Button */}
            <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                กลับ
            </Link>

            {/* Form Card */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-5 w-5 text-primary" />
                        เพิ่มสินค้าใหม่
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Row 1: Image + Title */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="image">ลิงก์รูปภาพ</Label>
                                <Input
                                    id="image"
                                    name="image"
                                    placeholder="https://..."
                                    value={formData.image}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="title">ชื่อสินค้า *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="ชื่อสินค้า"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 2: Category + Category Banner */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="category">ประเภท *</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    placeholder="เช่น ROV, Valorant"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="categoryBannerId">หมวดหมู่แบนเนอร์</Label>
                                <Select
                                    value={formData.categoryBannerId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, categoryBannerId: value === "none" ? "" : value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="-- ไม่บังคับ --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">ไม่เชื่อมโยง</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 3: Currency + Price */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>สกุลเงิน *</Label>
                                <RadioGroup
                                    value={formData.currency}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, currency: value }))
                                    }
                                    className="flex gap-4 h-9 items-center"
                                >
                                    <div className="flex items-center space-x-1.5">
                                        <RadioGroupItem value="THB" id="currency-thb" />
                                        <Label htmlFor="currency-thb" className="flex items-center gap-1 cursor-pointer text-sm">
                                            <Banknote className="h-3.5 w-3.5 text-green-600" />
                                            บาท
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <RadioGroupItem value="POINT" id="currency-point" />
                                        <Label htmlFor="currency-point" className="flex items-center gap-1 cursor-pointer text-sm">
                                            <Gem className="h-3.5 w-3.5 text-purple-600" />
                                            พอยท์
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="price">
                                    ราคา {formData.currency === "POINT" ? "(พอยท์)" : "(บาท)"} *
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
                                />
                            </div>
                        </div>

                        {/* Description (compact) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="description">รายละเอียด</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="คุณสมบัติ, ระดับ, สกิน ฯลฯ"
                                rows={2}
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Secret Data (required, always visible) */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="secretData"
                                className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400"
                            >
                                🔐 ข้อมูลลับ (ID/รหัสผ่าน) *
                            </Label>
                            <Textarea
                                id="secretData"
                                name="secretData"
                                placeholder="ID: ...&#10;รหัสผ่าน: ..."
                                rows={2}
                                value={formData.secretData}
                                onChange={handleChange}
                                required
                                className="border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                            />
                        </div>

                        {/* Advanced Options (Collapsible) */}
                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                            <CollapsibleTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-between text-muted-foreground hover:text-foreground"
                                >
                                    <span className="flex items-center gap-2">
                                        <Settings2 className="h-4 w-4" />
                                        ตัวเลือกเพิ่มเติม
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-3">
                                {/* Discount Section */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
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
                                                    <span className="flex items-center gap-1.5">
                                                        <Banknote className="h-3.5 w-3.5" />
                                                        ลดเป็นบาท
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="PERCENT">
                                                    <span className="flex items-center gap-1.5">
                                                        <Percent className="h-3.5 w-3.5" />
                                                        ลดเป็น %
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="discountValue">
                                            มูลค่าส่วนลด {formData.discountType === "PERCENT" ? "(%)" : "(บาท)"}
                                        </Label>
                                        <Input
                                            id="discountValue"
                                            name="discountValue"
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                            value={formData.discountValue}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Discount Preview */}
                                {discountPrice !== null && discountPrice > 0 && (
                                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                                        💰 ราคาหลังลด: <span className="font-bold">{discountPrice.toLocaleString()} {formData.currency === "POINT" ? "พอยท์" : "บาท"}</span>
                                    </div>
                                )}

                                {/* Purchase Limit */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="purchaseLimit">จำกัดซื้อต่อบัญชี (0 = ไม่จำกัด)</Label>
                                    <Input
                                        id="purchaseLimit"
                                        name="purchaseLimit"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={formData.purchaseLimit}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes">หมายเหตุ (หน้าสินค้า)</Label>
                                    <Input
                                        id="notes"
                                        name="notes"
                                        placeholder="ข้อมูลเพิ่มเติม"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Purchase Notes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="purchaseNotes">หมายเหตุการสั่งซื้อ</Label>
                                    <Input
                                        id="purchaseNotes"
                                        name="purchaseNotes"
                                        placeholder="ข้อความแจ้งเตือนก่อนซื้อ"
                                        value={formData.purchaseNotes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

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
                                "สร้างสินค้า"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
