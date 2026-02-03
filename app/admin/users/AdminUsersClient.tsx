"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Users, Crown, Coins, Gem, Search, Pencil, Loader2, ShieldCheck, Gamepad2, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";
import { type TierConfig } from "@/lib/tierHelpers";

// VIP threshold: Total Top-up > 10,000 THB
const VIP_TOPUP_THRESHOLD = 10000;

// Gold border threshold: Lifetime Points > 5,000
const GOLD_BORDER_POINTS_THRESHOLD = 5000;

interface Role {
    id: string;
    name: string;
    displayName: string;
    color: string;
    iconUrl: string | null;
}

interface User {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    roleRef: Role | null;
    creditBalance: string;
    totalTopup: string;
    pointBalance: number;
    lifetimePoints: number;
    createdAt: string;
    isVerified?: boolean;
    isInfluencer?: boolean;
}

interface AdminUsersClientProps {
    initialUsers: User[];
}

export default function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [tierConfig, setTierConfig] = useState<TierConfig | null>(null);

    // Form state for editing
    const [formData, setFormData] = useState({
        creditBalance: "",
        totalTopup: "",
        pointBalance: "",
        lifetimePoints: "",
        roleId: "",
        isVerified: false,
        isInfluencer: false,
    });

    // Fetch roles and tier config on mount
    useEffect(() => {
        // Fetch roles
        fetch("/api/admin/roles")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setRoles(data);
                }
            })
            .catch((err) => console.error("Error fetching roles:", err));

        // Fetch tier config
        fetch("/api/admin/settings/tiers")
            .then((res) => res.json())
            .then((data) => {
                if (data.tiers) {
                    setTierConfig(data);
                }
            })
            .catch((err) => console.error("Error fetching tier config:", err));
    }, []);

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.username.toLowerCase().includes(query) ||
                (user.name && user.name.toLowerCase().includes(query)) ||
                (user.email && user.email.toLowerCase().includes(query))
        );
    }, [users, searchQuery]);

    // Stats should use full user list, not filtered
    const vipCount = users.filter((u) => Number(u.totalTopup) > VIP_TOPUP_THRESHOLD).length;
    const totalCredits = users.reduce((sum, u) => sum + Number(u.creditBalance), 0);
    const totalPoints = users.reduce((sum, u) => sum + u.pointBalance, 0);

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormData({
            creditBalance: Number(user.creditBalance).toString(),
            totalTopup: Number(user.totalTopup).toString(),
            pointBalance: user.pointBalance.toString(),
            lifetimePoints: user.lifetimePoints.toString(),
            roleId: user.roleRef?.id || "",
            isVerified: user.isVerified || false,
            isInfluencer: user.isInfluencer || false,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingUser) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creditBalance: formData.creditBalance,
                    totalTopup: formData.totalTopup,
                    pointBalance: formData.pointBalance,
                    lifetimePoints: formData.lifetimePoints,
                    roleId: formData.roleId || null,
                    isVerified: formData.isVerified,
                    isInfluencer: formData.isInfluencer,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "เกิดข้อผิดพลาด");
                return;
            }

            // Update local state
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUser.id
                        ? {
                            ...u,
                            creditBalance: data.user.creditBalance,
                            totalTopup: data.user.totalTopup,
                            pointBalance: data.user.pointBalance,
                            lifetimePoints: data.user.lifetimePoints,
                            roleId: u.roleRef, // Keep existing ref or refetch if needed
                            roleRef: data.user.roleRef || u.roleRef, // Ideally API returns populated roleRef
                            isVerified: data.user.isVerified,
                            isInfluencer: data.user.isInfluencer,
                        }
                        : u
                )
            );

            setIsDialogOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
                    ระบบบริหารจัดการสมาชิก <span className="text-3xl">👥</span>
                </h1>
                <p className="text-zinc-500">ดูข้อมูลสมาชิก เครดิต และพอยต์ทั้งหมด</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">สมาชิกทั้งหมด</p>
                            <p className="text-2xl font-bold">{users.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Crown className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">สมาชิก VIP</p>
                            <p className="text-2xl font-bold">{vipCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Coins className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">เครดิตรวมทั้งระบบ</p>
                            <p className="text-2xl font-bold">฿{totalCredits.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Gem className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">พอยต์รวมทั้งระบบ</p>
                            <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Box */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="ค้นหาด้วยชื่อผู้ใช้, ชื่อ, หรืออีเมล..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        รายชื่อสมาชิก ({filteredUsers.length}
                        {searchQuery && ` จาก ${users.length}`})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-zinc-300" />
                            <p className="mt-4 text-zinc-500">
                                {searchQuery ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ยังไม่มีสมาชิก"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ข้อมูลสมาชิก</TableHead>
                                        <TableHead className="text-right">เครดิตคงเหลือ</TableHead>
                                        <TableHead className="text-right">ยอดเติมสะสม</TableHead>
                                        <TableHead className="text-right">พอยต์คงเหลือ</TableHead>
                                        <TableHead className="text-right">พอยต์สะสม</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead>วันที่สมัคร</TableHead>
                                        <TableHead className="text-center">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const isVIP = Number(user.totalTopup) > (tierConfig?.tiers.gold.min || VIP_TOPUP_THRESHOLD);
                                        const hasGoldBorder = user.lifetimePoints > GOLD_BORDER_POINTS_THRESHOLD;

                                        return (
                                            <TableRow key={user.id}>
                                                {/* User Info Column */}
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 ring-2 ring-white">
                                                            {user.image ? (
                                                                <img
                                                                    src={user.image}
                                                                    alt={user.username}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-zinc-400">
                                                                    <Users className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-zinc-900">
                                                                {user.name || user.username}
                                                            </div>
                                                            <div className="text-xs text-zinc-500">
                                                                {user.email || user.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Current Credit */}
                                                <TableCell className="text-right font-bold text-green-600">
                                                    ฿{Number(user.creditBalance).toLocaleString()}
                                                </TableCell>

                                                {/* Total Top-up */}
                                                <TableCell className="text-right">
                                                    <span
                                                        className={`font-medium ${isVIP ? "text-amber-600" : "text-zinc-600"
                                                            }`}
                                                    >
                                                        ฿{Number(user.totalTopup).toLocaleString()}
                                                    </span>
                                                </TableCell>

                                                {/* Available Points */}
                                                <TableCell className="text-right font-bold text-purple-600">
                                                    💎 {user.pointBalance.toLocaleString()}
                                                </TableCell>

                                                {/* Lifetime Points */}
                                                <TableCell className="text-right">
                                                    <span
                                                        className={`font-medium ${hasGoldBorder ? "text-amber-600" : "text-zinc-600"
                                                            }`}
                                                    >
                                                        {user.lifetimePoints.toLocaleString()}
                                                    </span>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Assigned Role */}
                                                        {user.roleRef ? (
                                                            <div className="flex items-center gap-1.5">
                                                                {user.roleRef.iconUrl && (
                                                                    <img
                                                                        src={user.roleRef.iconUrl}
                                                                        alt={user.roleRef.displayName}
                                                                        className="h-4 w-4 object-contain"
                                                                    />
                                                                )}
                                                                <span
                                                                    className="px-2 py-0.5 rounded text-[10px] font-medium text-white shadow-sm"
                                                                    style={{ backgroundColor: user.roleRef.color }}
                                                                >
                                                                    {user.roleRef.displayName}
                                                                </span>
                                                            </div>
                                                        ) : user.role === "ADMIN" ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white">
                                                                <ShieldCheck className="h-3 w-3 mr-1" />
                                                                แอดมิน
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-zinc-400">สมาชิก</span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Registration Date */}
                                                <TableCell className="text-zinc-500">
                                                    {new Date(user.createdAt).toLocaleDateString("th-TH", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </TableCell>

                                                {/* Edit Button */}
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(user)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        แก้ไข
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-zinc-700">คำอธิบายสัญลักษณ์</h3>
                        <Link
                            href="/admin/settings/tiers"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                            <Settings className="h-3 w-3" />
                            ตั้งค่าเกณฑ์
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-zinc-600">
                        {/* Bronze */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-700 to-amber-800 text-white">
                                🥉 Bronze
                            </span>
                            <span>= เริ่มต้น ({tierConfig?.tiers.bronze.min.toLocaleString() || "500"}+ บาท)</span>
                        </div>
                        {/* Silver */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                                🥈 Silver
                            </span>
                            <span>= ปานกลาง ({tierConfig?.tiers.silver.min.toLocaleString() || "1,000"}+ บาท)</span>
                        </div>
                        {/* Gold */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-600 text-white">
                                🥇 Gold
                            </span>
                            <span>= VIP ({tierConfig?.tiers.gold.min.toLocaleString() || "5,000"}+ บาท)</span>
                        </div>
                        {/* Diamond */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-400 to-cyan-600 text-white">
                                💎 Diamond
                            </span>
                            <span>= สูงมาก ({tierConfig?.tiers.diamond.min.toLocaleString() || "50,000"}+ บาท)</span>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                                👑 Legend
                            </span>
                            <span>= สูงสุด ({tierConfig?.tiers.legend.min.toLocaleString() || "200,000"}+ บาท)</span>
                        </div>
                        {/* Points Border */}
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 ring-2 ring-amber-400 ring-offset-1"></div>
                            <span>= พอยต์สะสม {tierConfig?.borders.gold.toLocaleString() || "5,000"}+ แต้ม</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5" />
                            แก้ไขข้อมูล: {editingUser?.username}
                        </DialogTitle>
                        <DialogDescription>
                            แก้ไขเครดิตและพอยต์ของผู้ใช้
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="creditBalance">เครดิตคงเหลือ (บาท)</Label>
                                <Input
                                    id="creditBalance"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.creditBalance}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, creditBalance: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalTopup">ยอดเติมสะสม (บาท)</Label>
                                <Input
                                    id="totalTopup"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.totalTopup}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, totalTopup: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pointBalance">พอยต์คงเหลือ</Label>
                                <Input
                                    id="pointBalance"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.pointBalance}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, pointBalance: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lifetimePoints">พอยต์สะสม</Label>
                                <Input
                                    id="lifetimePoints"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.lifetimePoints}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, lifetimePoints: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Special Badges Checkboxes */}
                        <div className="space-y-3 pt-2 border-t">
                            <Label>สถานะพิเศษ</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}>
                                    <input
                                        type="checkbox"
                                        id="isVerified"
                                        checked={formData.isVerified}
                                        onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label htmlFor="isVerified" className="cursor-pointer flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-blue-500" />
                                        <span>ยืนยันตัวตน (Verified)</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, isInfluencer: !formData.isInfluencer })}>
                                    <input
                                        type="checkbox"
                                        id="isInfluencer"
                                        checked={formData.isInfluencer}
                                        onChange={(e) => setFormData({ ...formData, isInfluencer: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label htmlFor="isInfluencer" className="cursor-pointer flex items-center gap-2">
                                        <Gamepad2 className="h-4 w-4 text-pink-500" />
                                        <span>ผู้มีอิทธิพล (Influencer)</span>
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="roleId">ยศ</Label>
                            <select
                                id="roleId"
                                value={formData.roleId}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, roleId: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">ไม่มียศ (ผู้ใช้ทั่วไป)</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                "บันทึก"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
