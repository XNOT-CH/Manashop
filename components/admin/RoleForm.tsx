"use client";

import { useState } from "react";
import { PERMISSION_GROUPS, PERMISSION_LABELS, Permission } from "@/lib/permissions";
import { X } from "lucide-react";

interface RoleFormProps {
    role?: {
        id: string;
        name: string;
        displayName: string;
        iconUrl: string | null;
        color: string;
        permissions: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function RoleForm({ role, onClose, onSuccess }: RoleFormProps) {
    const [formData, setFormData] = useState({
        name: role?.name || "",
        displayName: role?.displayName || "",
        iconUrl: role?.iconUrl || "",
        color: role?.color || "#6366f1",
        permissions: role ? JSON.parse(role.permissions) : [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = role
                ? `/api/admin/roles/${role.id}`
                : "/api/admin/roles";
            const method = role ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาด");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permission: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter((p: string) => p !== permission)
                : [...prev.permissions, permission],
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                        {role ? "แก้ไขยศ" : "สร้างยศใหม่"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    ชื่อยศ (Internal Name) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="ASSISTANT_ADMIN"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    ใช้สำหรับระบบ (ตัวพิมพ์ใหญ่, ไม่มีช่องว่าง)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    ชื่อแสดง (Display Name) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, displayName: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="ผู้ช่วยแอดมิน"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    ชื่อที่แสดงให้ผู้ใช้เห็น
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    ลิงค์ภาพไอคอน
                                </label>
                                <input
                                    type="url"
                                    value={formData.iconUrl}
                                    onChange={(e) =>
                                        setFormData({ ...formData, iconUrl: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="https://example.com/icon.png"
                                />
                                {formData.iconUrl && (
                                    <div className="mt-2">
                                        <img
                                            src={formData.iconUrl}
                                            alt="Icon preview"
                                            className="h-12 w-12 object-contain rounded border"
                                            onError={(e) => {
                                                e.currentTarget.src = "";
                                                e.currentTarget.alt = "Invalid URL";
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    สีของยศ
                                </label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) =>
                                            setFormData({ ...formData, color: e.target.value })
                                        }
                                        className="h-12 w-20 border rounded-lg cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.color}
                                            onChange={(e) =>
                                                setFormData({ ...formData, color: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                                            placeholder="#6366f1"
                                        />
                                    </div>
                                </div>
                                <div
                                    className="mt-2 px-3 py-1.5 rounded-full inline-flex items-center text-sm font-medium text-white"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    {formData.displayName || "ตัวอย่าง"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">สิทธิ์การเข้าถึง</h3>
                        <p className="text-sm text-gray-600">
                            เลือกส่วนต่างๆ ของแผงควบคุมที่ยศนี้สามารถเข้าถึงได้
                        </p>

                        <div className="space-y-6">
                            {PERMISSION_GROUPS.map((group) => (
                                <div key={group.name} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">{group.name}</h4>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {group.permissions.map((permission) => (
                                            <label
                                                key={permission}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(permission)}
                                                    onChange={() => togglePermission(permission)}
                                                    className="h-4 w-4 text-primary rounded focus:ring-2 focus:ring-primary"
                                                />
                                                <span className="text-sm">
                                                    {PERMISSION_LABELS[permission as Permission]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "กำลังบันทึก..." : role ? "บันทึกการแก้ไข" : "สร้างยศ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
