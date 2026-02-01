"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, Link as LinkIcon, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface FooterLink {
    id: string;
    label: string;
    href: string;
    openInNewTab: boolean;
    sortOrder: number;
    isActive: boolean;
}

interface FooterSettings {
    id: string;
    isActive: boolean;
    title: string;
}

export default function FooterLinksAdminPage() {
    const [settings, setSettings] = useState<FooterSettings | null>(null);
    const [links, setLinks] = useState<FooterLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [newLabel, setNewLabel] = useState("");
    const [newHref, setNewHref] = useState("");
    const [newOpenInNewTab, setNewOpenInNewTab] = useState(false);

    // Edit modal
    const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editHref, setEditHref] = useState("");
    const [editOpenInNewTab, setEditOpenInNewTab] = useState(false);
    const [editIsActive, setEditIsActive] = useState(true);

    // Delete dialog
    const [deletingLink, setDeletingLink] = useState<FooterLink | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/footer-links");
            const data = await res.json();
            setSettings(data.settings);
            setLinks(data.links);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleActive = async (isActive: boolean) => {
        try {
            const res = await fetch("/api/admin/footer-links/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive }),
            });
            if (res.ok) {
                const updated = await res.json();
                setSettings(updated);
                toast.success(isActive ? "เปิดการแสดงผลแล้ว" : "ปิดการแสดงผลแล้ว");
            }
        } catch (error) {
            console.error("Error toggling active:", error);
            toast.error("ไม่สามารถอัปเดตได้");
        }
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim() || !newHref.trim()) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/footer-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: newLabel.trim(),
                    href: newHref.trim(),
                    openInNewTab: newOpenInNewTab,
                }),
            });

            if (res.ok) {
                const newLink = await res.json();
                setLinks([...links, newLink]);
                setNewLabel("");
                setNewHref("");
                setNewOpenInNewTab(false);
                toast.success("เพิ่มลิงก์เรียบร้อย");
            } else {
                toast.error("ไม่สามารถเพิ่มลิงก์ได้");
            }
        } catch (error) {
            console.error("Error adding link:", error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (link: FooterLink) => {
        setEditingLink(link);
        setEditLabel(link.label);
        setEditHref(link.href);
        setEditOpenInNewTab(link.openInNewTab);
        setEditIsActive(link.isActive);
    };

    const handleEditLink = async () => {
        if (!editingLink || !editLabel.trim() || !editHref.trim()) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/footer-links/${editingLink.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: editLabel.trim(),
                    href: editHref.trim(),
                    openInNewTab: editOpenInNewTab,
                    isActive: editIsActive,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setLinks(links.map((l) => (l.id === updated.id ? updated : l)));
                setEditingLink(null);
                toast.success("แก้ไขลิงก์เรียบร้อย");
            } else {
                toast.error("ไม่สามารถแก้ไขลิงก์ได้");
            }
        } catch (error) {
            console.error("Error editing link:", error);
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = async () => {
        if (!deletingLink) return;

        try {
            const res = await fetch(`/api/admin/footer-links/${deletingLink.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setLinks(links.filter((l) => l.id !== deletingLink.id));
                setDeletingLink(null);
                toast.success("ลบลิงก์เรียบร้อย");
            } else {
                toast.error("ไม่สามารถลบลิงก์ได้");
            }
        } catch (error) {
            console.error("Error deleting link:", error);
            toast.error("เกิดข้อผิดพลาด");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">จัดการเมนูลัดส่วนท้าย (Footer Widget)</h1>
                <p className="text-muted-foreground">
                    เพิ่ม แก้ไข หรือลบลิงก์ที่แสดงในส่วนท้ายของเว็บไซต์
                </p>
            </div>

            {/* Toggle Active */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>แสดงผลบนหน้าเว็บ</span>
                        <Switch
                            checked={settings?.isActive ?? false}
                            onCheckedChange={handleToggleActive}
                        />
                    </CardTitle>
                    <CardDescription>
                        เปิดเพื่อโชว์เมนูนี้ให้ลูกค้าเห็น
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Add New Link Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        เพิ่มลิงก์ใหม่
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddLink} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newLabel">ข้อความที่โชว์</Label>
                                <Input
                                    id="newLabel"
                                    placeholder="เช่น วิธีเติมเงิน, ติดต่อเรา"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newHref">ลิงก์ไปที่</Label>
                                <Input
                                    id="newHref"
                                    placeholder="เช่น /how-to-topup หรือ https://facebook.com/..."
                                    value={newHref}
                                    onChange={(e) => setNewHref(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newOpenInNewTab"
                                    checked={newOpenInNewTab}
                                    onCheckedChange={(checked) =>
                                        setNewOpenInNewTab(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="newOpenInNewTab"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    เปิดแท็บใหม่ (สำหรับลิงก์ออกไปเว็บอื่น)
                                </Label>
                            </div>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                เพิ่มลิงก์
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Links List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        รายการลิงก์ ({links.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {links.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            ยังไม่มีลิงก์ เพิ่มลิงก์แรกของคุณด้านบน
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>ข้อความ</TableHead>
                                    <TableHead>ลิงก์</TableHead>
                                    <TableHead className="text-center">แท็บใหม่</TableHead>
                                    <TableHead className="text-center">สถานะ</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {links.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {link.label}
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline group max-w-[250px]"
                                            >
                                                <span className="truncate">{link.href}</span>
                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {link.openInNewTab && (
                                                <ExternalLink className="h-4 w-4 mx-auto text-blue-500" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${link.isActive
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}
                                            >
                                                {link.isActive ? "แสดง" : "ซ่อน"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(link)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeletingLink(link)}
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

            {/* Edit Modal */}
            <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แก้ไขลิงก์</DialogTitle>
                        <DialogDescription>
                            แก้ไขข้อมูลลิงก์ด้านล่าง
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editLabel">ข้อความที่โชว์</Label>
                            <Input
                                id="editLabel"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editHref">ลิงก์ไปที่</Label>
                            <Input
                                id="editHref"
                                value={editHref}
                                onChange={(e) => setEditHref(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="editOpenInNewTab"
                                checked={editOpenInNewTab}
                                onCheckedChange={(checked) =>
                                    setEditOpenInNewTab(checked === true)
                                }
                            />
                            <Label htmlFor="editOpenInNewTab" className="cursor-pointer">
                                เปิดแท็บใหม่
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="editIsActive"
                                checked={editIsActive}
                                onCheckedChange={(checked) =>
                                    setEditIsActive(checked === true)
                                }
                            />
                            <Label htmlFor="editIsActive" className="cursor-pointer">
                                แสดงผลลิงก์นี้
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingLink(null)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleEditLink} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingLink} onOpenChange={() => setDeletingLink(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบลิงก์ &quot;{deletingLink?.label}&quot; ใช่หรือไม่?
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLink}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
