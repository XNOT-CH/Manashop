"use client";

import { useState, useEffect } from "react";
import { RoleForm } from "@/components/admin/RoleForm";
import { Shield, Edit, Trash2, Plus, Users, AlertCircle } from "lucide-react";

interface Role {
    id: string;
    name: string;
    displayName: string;
    iconUrl: string | null;
    color: string;
    permissions: string;
    isSystem: boolean;
    sortOrder: number;
    _count: {
        users: number;
    };
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/admin/roles");

            if (!response.ok) {
                console.error("Failed to fetch roles:", response.status);
                setRoles([]);
                return;
            }

            const data = await response.json();

            // Ensure data is an array before setting state
            if (Array.isArray(data)) {
                setRoles(data);
            } else {
                console.error("API did not return an array:", data);
                setRoles([]);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (roleId: string) => {
        try {
            const response = await fetch(`/api/admin/roles/${roleId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
                return;
            }

            alert("ลบยศสำเร็จ");
            fetchRoles();
            setDeleteConfirm(null);
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบยศ");
        }
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setSelectedRole(null);
    };

    const getPermissionCount = (permissions: string) => {
        try {
            return JSON.parse(permissions).length;
        } catch {
            return 0;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        จัดการยศ
                    </h1>
                    <p className="text-gray-600 mt-2">
                        จัดการยศและสิทธิ์การเข้าถึงของแอดมิน
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-md"
                >
                    <Plus className="h-5 w-5" />
                    สร้างยศใหม่
                </button>
            </div>

            {/* Roles Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                ยศ
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                ชื่อในระบบ
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                จำนวนสิทธิ์
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                ผู้ใช้
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                สถานะ
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                                จัดการ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {role.iconUrl && (
                                            <img
                                                src={role.iconUrl}
                                                alt={role.displayName}
                                                className="h-8 w-8 object-contain rounded"
                                            />
                                        )}
                                        <div
                                            className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                            style={{ backgroundColor: role.color }}
                                        >
                                            {role.displayName}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                        {role.name}
                                    </code>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">
                                        {getPermissionCount(role.permissions)} สิทธิ์
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span>{role._count.users} คน</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {role.isSystem ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            <AlertCircle className="h-3 w-3" />
                                            ยศระบบ
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">
                                            ยศกำหนดเอง
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(role)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="แก้ไข"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        {!role.isSystem && (
                                            <>
                                                {deleteConfirm === role.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDelete(role.id)}
                                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                        >
                                                            ยืนยัน
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(null)}
                                                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(role.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {roles.length === 0 && (
                    <div className="text-center py-12">
                        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">ยังไม่มียศในระบบ</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-primary hover:underline"
                        >
                            สร้างยศแรกของคุณ
                        </button>
                    </div>
                )}
            </div>

            {/* Role Form Modal */}
            {showForm && (
                <RoleForm
                    role={selectedRole || undefined}
                    onClose={handleFormClose}
                    onSuccess={() => {
                        fetchRoles();
                        handleFormClose();
                    }}
                />
            )}
        </div>
    );
}
