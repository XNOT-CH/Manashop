"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ImageIcon,
    ExternalLink,
    LayoutGrid,
} from "lucide-react";
import Image from "next/image";

interface CategoryBanner {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    productCount: number;
    sortOrder: number;
    isActive: boolean;
    showOnHome: boolean;
    showOnProducts: boolean;
    createdAt: string;
}

export default function AdminCategoryBannersPage() {
    const [banners, setBanners] = useState<CategoryBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<CategoryBanner | null>(null);
    const [deletingBanner, setDeletingBanner] = useState<CategoryBanner | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        imageUrl: "",
        linkUrl: "",
        minPrice: "",
        maxPrice: "",
        productCount: "0",
        sortOrder: "0",
        isActive: true,
        showOnHome: true,
        showOnProducts: false,
    });

    // Fetch banners
    const fetchBanners = async () => {
        try {
            const res = await fetch("/api/admin/category-banners");
            if (res.ok) {
                const data = await res.json();
                setBanners(data);
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    // Open dialog for create/edit
    const openDialog = (banner?: CategoryBanner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                name: banner.name,
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl || "",
                minPrice: banner.minPrice?.toString() || "",
                maxPrice: banner.maxPrice?.toString() || "",
                productCount: banner.productCount.toString(),
                sortOrder: banner.sortOrder.toString(),
                isActive: banner.isActive,
                showOnHome: banner.showOnHome,
                showOnProducts: banner.showOnProducts,
            });
        } else {
            setEditingBanner(null);
            setFormData({
                name: "",
                imageUrl: "",
                linkUrl: "",
                minPrice: "",
                maxPrice: "",
                productCount: "0",
                sortOrder: "0",
                isActive: true,
                showOnHome: true,
                showOnProducts: false,
            });
        }
        setDialogOpen(true);
    };

    // Save banner
    const handleSave = async () => {
        if (!formData.name || !formData.imageUrl) {
            alert("กรุณากรอกชื่อและ URL รูปภาพ");
            return;
        }

        setSaving(true);
        try {
            const url = editingBanner
                ? `/api/admin/category-banners/${editingBanner.id}`
                : "/api/admin/category-banners";
            const method = editingBanner ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    productCount: parseInt(formData.productCount) || 0,
                    sortOrder: parseInt(formData.sortOrder) || 0,
                }),
            });

            if (res.ok) {
                setDialogOpen(false);
                fetchBanners();
            } else {
                const error = await res.json();
                alert(error.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("Error saving banner:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    // Delete banner
    const handleDelete = async () => {
        if (!deletingBanner) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/category-banners/${deletingBanner.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setDeleteDialogOpen(false);
                setDeletingBanner(null);
                fetchBanners();
            }
        } catch (error) {
            console.error("Error deleting banner:", error);
        } finally {
            setSaving(false);
        }
    };

    // Toggle active status
    const toggleActive = async (banner: CategoryBanner) => {
        try {
            const res = await fetch(`/api/admin/category-banners/${banner.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !banner.isActive }),
            });

            if (res.ok) {
                fetchBanners();
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    // Format price
    const formatPrice = (price: number | null) => {
        if (price === null) return "-";
        return `฿${price.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6" />
                        จัดการแบนเนอร์หมวดหมู่
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        จัดการแบนเนอร์หมวดหมู่สินค้าที่แสดงในหน้าต่างๆ
                    </p>
                </div>
                <Button onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มแบนเนอร์
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">รูปภาพ</TableHead>
                            <TableHead>ชื่อหมวดหมู่</TableHead>
                            <TableHead>ช่วงราคา</TableHead>
                            <TableHead>แสดงที่</TableHead>
                            <TableHead className="text-center">สถานะ</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {banners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    ยังไม่มีแบนเนอร์ คลิก &quot;เพิ่มแบนเนอร์&quot; เพื่อสร้างใหม่
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell>
                                        <div className="relative w-[160px] aspect-[1640/500] rounded overflow-hidden bg-muted">
                                            {banner.imageUrl ? (
                                                <Image
                                                    src={banner.imageUrl}
                                                    alt={banner.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="160px"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{banner.name}</div>
                                        {banner.linkUrl && (
                                            <a
                                                href={banner.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                ดูลิงก์
                                            </a>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatPrice(banner.minPrice)} - {formatPrice(banner.maxPrice)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {banner.showOnHome && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    หน้าแรก
                                                </span>
                                            )}
                                            {banner.showOnProducts && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    หน้าสินค้า
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={banner.isActive}
                                            onCheckedChange={() => toggleActive(banner)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(banner)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    setDeletingBanner(banner);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBanner ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์ใหม่"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Preview */}
                        {formData.imageUrl && (
                            <div className="relative w-full aspect-[1640/500] rounded-lg overflow-hidden bg-muted">
                                <Image
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 600px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <h3 className="text-2xl font-bold text-white">
                                        {formData.name || "ชื่อหมวดหมู่"}
                                    </h3>
                                </div>
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="เช่น เกม PC, บัตรเติมเงิน"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL รูปภาพ * (แนะนำ 1640x500)</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://example.com/banner.jpg"
                            />
                        </div>

                        {/* Link URL */}
                        <div className="space-y-2">
                            <Label htmlFor="linkUrl">ลิงก์เมื่อคลิก (ถ้ามี)</Label>
                            <Input
                                id="linkUrl"
                                value={formData.linkUrl}
                                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                placeholder="/products?category=xxx หรือ URL ภายนอก"
                            />
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minPrice">ราคาต่ำสุด (บาท)</Label>
                                <Input
                                    id="minPrice"
                                    type="number"
                                    value={formData.minPrice}
                                    onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxPrice">ราคาสูงสุด (บาท)</Label>
                                <Input
                                    id="maxPrice"
                                    type="number"
                                    value={formData.maxPrice}
                                    onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Product Count & Sort Order */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="productCount">จำนวนสินค้า</Label>
                                <Input
                                    id="productCount"
                                    type="number"
                                    value={formData.productCount}
                                    onChange={(e) => setFormData({ ...formData, productCount: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">ลำดับการแสดง</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Page Placement */}
                        <div className="space-y-3">
                            <Label>แสดงที่หน้า</Label>
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={formData.showOnHome}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, showOnHome: checked === true })
                                        }
                                    />
                                    <span>หน้าแรก (Homepage)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={formData.showOnProducts}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, showOnProducts: checked === true })
                                        }
                                    />
                                    <span>หน้าสินค้า (Products)</span>
                                </label>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">เปิดใช้งาน</Label>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isActive: checked })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingBanner ? "บันทึก" : "สร้าง"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการลบ</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        คุณต้องการลบแบนเนอร์ &quot;{deletingBanner?.name}&quot; ใช่หรือไม่?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ลบ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
