"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Plus,
    Upload,
    Package,
    Loader2,
    Trash2,
    Pencil,
    History,
    Database,
    Key,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
}

interface ProductCode {
    id: string;
    productId: string;
    code: string;
    isSold: boolean;
    soldAt: string | null;
    orderId: string | null;
    createdAt: string;
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    order: {
        id: string;
        userId: string;
        purchasedAt: string;
        user: {
            id: string;
            username: string;
            name: string | null;
        };
    } | null;
}

interface Summary {
    productId: string;
    isSold: boolean;
    _count: number;
}

export default function AdminProductCodesPage() {
    const searchParams = useSearchParams();
    const urlProductId = searchParams.get("productId");

    const [products, setProducts] = useState<Product[]>([]);
    const [codes, setCodes] = useState<ProductCode[]>([]);
    const [summary, setSummary] = useState<Summary[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Form state
    const [selectedProduct, setSelectedProduct] = useState<string>("");
    const [singleCode, setSingleCode] = useState("");
    const [bulkCodes, setBulkCodes] = useState("");

    // Filter state
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterSold, setFilterSold] = useState<string>("all");

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<ProductCode | null>(null);
    const [editValue, setEditValue] = useState("");

    // Show/hide code state
    const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

    // Fetch products
    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.success !== false) {
                setProducts(data.products || data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }, []);

    // Fetch codes
    const fetchCodes = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterProduct !== "all") {
                params.append("productId", filterProduct);
            }
            if (filterSold !== "all") {
                params.append("isSold", filterSold);
            }

            const res = await fetch(`/api/admin/product-codes?${params}`);
            const data = await res.json();
            if (data.success) {
                setCodes(data.codes);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Error fetching codes:", error);
        } finally {
            setLoading(false);
        }
    }, [filterProduct, filterSold]);

    useEffect(() => {
        fetchProducts();
        fetchCodes();
    }, [fetchProducts, fetchCodes]);

    // Auto-select product from URL after products are loaded
    useEffect(() => {
        if (!initialized && urlProductId && products.length > 0) {
            const productExists = products.some(p => p.id === urlProductId);
            if (productExists) {
                setSelectedProduct(urlProductId);
                setFilterProduct(urlProductId);
            }
            setInitialized(true);
        }
    }, [urlProductId, products, initialized]);

    // Add single code
    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !singleCode.trim()) {
            toast.error("กรุณาเลือกสินค้าและกรอกรหัส");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/product-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct,
                    code: singleCode.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setSingleCode("");
                fetchCodes();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    // Bulk import
    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !bulkCodes.trim()) {
            toast.error("กรุณาเลือกสินค้าและกรอกรหัส");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/product-codes/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProduct,
                    codes: bulkCodes,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setBulkCodes("");
                fetchCodes();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    // Edit code
    const handleEdit = async () => {
        if (!editingCode || !editValue.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/product-codes/${editingCode.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: editValue.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setEditDialogOpen(false);
                setEditingCode(null);
                setEditValue("");
                fetchCodes();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete code
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "ลบรหัสสินค้า?",
            text: "คุณต้องการลบรหัสนี้ใช่หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ใช่, ลบเลย",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/admin/product-codes/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchCodes();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        }
    };

    // Toggle code visibility
    const toggleCodeVisibility = (id: string) => {
        setVisibleCodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Calculate summary for a product
    const getProductSummary = (productId: string) => {
        const available = summary.find(
            (s) => s.productId === productId && !s.isSold
        )?._count || 0;
        const sold = summary.find(
            (s) => s.productId === productId && s.isSold
        )?._count || 0;
        return { available, sold, total: available + sold };
    };

    // Filter codes by tab
    const availableCodes = codes.filter((c) => !c.isSold);
    const soldCodes = codes.filter((c) => c.isSold);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
                    คลังรหัสสินค้า <span className="text-3xl">🔑</span>
                </h1>
                <p className="text-zinc-500">
                    จัดการรหัส/คีย์สำหรับสินค้าดิจิทัล
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                            รหัสทั้งหมด
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{codes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <Database className="h-4 w-4 text-green-500" />
                            พร้อมขาย
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {availableCodes.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <History className="h-4 w-4 text-blue-500" />
                            ขายแล้ว
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {soldCodes.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="add" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="add" className="gap-2">
                        <Plus className="h-4 w-4" />
                        เพิ่มรหัส
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2">
                        <Package className="h-4 w-4" />
                        คลังรหัส
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        ประวัติการขาย
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Add Codes */}
                <TabsContent value="add">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                เพิ่มรหัสสินค้า
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Product Selection */}
                            <div className="space-y-2">
                                <Label>เลือกสินค้า</Label>
                                <Select
                                    value={selectedProduct}
                                    onValueChange={setSelectedProduct}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกสินค้า..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => {
                                            const s = getProductSummary(p.id);
                                            return (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} ({s.available} พร้อมขาย)
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Single Code */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        เพิ่มทีละรหัส
                                    </h3>
                                    <form onSubmit={handleAddSingle} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>รหัส/คีย์</Label>
                                            <Input
                                                value={singleCode}
                                                onChange={(e) => setSingleCode(e.target.value)}
                                                placeholder="เช่น XXXX-XXXX-XXXX"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={submitting || !selectedProduct}
                                            className="w-full"
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            เพิ่มรหัส
                                        </Button>
                                    </form>
                                </div>

                                {/* Bulk Import */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        นำเข้าแบบชุด
                                    </h3>
                                    <form onSubmit={handleBulkImport} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>รหัสหลายตัว (1 บรรทัด = 1 รหัส)</Label>
                                            <Textarea
                                                value={bulkCodes}
                                                onChange={(e) => setBulkCodes(e.target.value)}
                                                placeholder={`XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ`}
                                                rows={5}
                                            />
                                            <p className="text-xs text-zinc-500">
                                                {bulkCodes.split("\n").filter((l) => l.trim()).length} รหัส
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={submitting || !selectedProduct}
                                            className="w-full"
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            นำเข้าทั้งหมด
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Inventory */}
                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    รหัสพร้อมขาย ({availableCodes.length})
                                </span>
                                <div className="flex gap-2">
                                    <Select
                                        value={filterProduct}
                                        onValueChange={setFilterProduct}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="ทุกสินค้า" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">ทุกสินค้า</SelectItem>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                </div>
                            ) : availableCodes.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>ไม่มีรหัสในคลัง</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>เพิ่มเมื่อ</TableHead>
                                            <TableHead className="text-right">จัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableCodes.map((code) => (
                                            <TableRow key={code.id}>
                                                <TableCell className="font-medium">
                                                    {code.product.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-zinc-100 px-2 py-1 rounded text-sm font-mono">
                                                            {visibleCodes.has(code.id)
                                                                ? code.code
                                                                : "••••••••••••"}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleCodeVisibility(code.id)}
                                                        >
                                                            {visibleCodes.has(code.id) ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-zinc-500">
                                                    {new Date(code.createdAt).toLocaleDateString("th-TH")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Dialog
                                                            open={editDialogOpen && editingCode?.id === code.id}
                                                            onOpenChange={(open) => {
                                                                setEditDialogOpen(open);
                                                                if (!open) {
                                                                    setEditingCode(null);
                                                                    setEditValue("");
                                                                }
                                                            }}
                                                        >
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setEditingCode(code);
                                                                        setEditValue(code.code);
                                                                        setEditDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>แก้ไขรหัส</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label>รหัส</Label>
                                                                        <Input
                                                                            value={editValue}
                                                                            onChange={(e) =>
                                                                                setEditValue(e.target.value)
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        onClick={handleEdit}
                                                                        disabled={submitting}
                                                                        className="w-full"
                                                                    >
                                                                        {submitting ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                        ) : null}
                                                                        บันทึก
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(code.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Sales History */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                ประวัติการขาย ({soldCodes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                </div>
                            ) : soldCodes.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>ยังไม่มีประวัติการขาย</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>ลูกค้า</TableHead>
                                            <TableHead>วันที่ขาย</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {soldCodes.map((code) => (
                                            <TableRow key={code.id}>
                                                <TableCell className="font-medium">
                                                    {code.product.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-zinc-100 px-2 py-1 rounded text-sm font-mono">
                                                            {visibleCodes.has(code.id)
                                                                ? code.code
                                                                : "••••••••••••"}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleCodeVisibility(code.id)}
                                                        >
                                                            {visibleCodes.has(code.id) ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {code.order?.user ? (
                                                        <div>
                                                            <div className="font-medium">
                                                                {code.order.user.name || code.order.user.username}
                                                            </div>
                                                            <div className="text-xs text-zinc-500">
                                                                @{code.order.user.username}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {code.soldAt
                                                        ? new Date(code.soldAt).toLocaleString("th-TH")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                        ขายแล้ว
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
