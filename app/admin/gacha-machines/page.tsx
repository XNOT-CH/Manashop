"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, LayoutGrid, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";

interface GachaCategory {
    id: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    _count: { machines: number };
}

interface GachaMachine {
    id: string;
    name: string;
    imageUrl: string | null;
    categoryId: string | null;
    costType: string;
    costAmount: number;
    dailySpinLimit: number;
    isActive: boolean;
    isEnabled: boolean;
    sortOrder: number;
    category: { name: string } | null;
    _count: { rewards: number };
}

export default function GachaMachinesAdminPage() {
    const [categories, setCategories] = useState<GachaCategory[]>([]);
    const [machines, setMachines] = useState<GachaMachine[]>([]);
    const [loading, setLoading] = useState(true);

    // Category form
    const [newCatName, setNewCatName] = useState("");
    const [savingCat, setSavingCat] = useState(false);

    // Machine form
    const [showMachineForm, setShowMachineForm] = useState(false);
    const [machineForm, setMachineForm] = useState({ name: "", imageUrl: "", categoryId: "", costType: "FREE", costAmount: 0, dailySpinLimit: 0, sortOrder: 0 });
    const [savingMachine, setSavingMachine] = useState(false);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [catRes, machRes] = await Promise.all([
                fetch("/api/admin/gacha-categories"),
                fetch("/api/admin/gacha-machines"),
            ]);
            const catJson = await catRes.json() as { success: boolean; data: GachaCategory[] };
            const machJson = await machRes.json() as { success: boolean; data: GachaMachine[] };
            if (catJson.success) setCategories(catJson.data);
            if (machJson.success) setMachines(machJson.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { void loadAll(); }, []);

    const addCategory = async () => {
        if (!newCatName.trim()) return;
        setSavingCat(true);
        try {
            const res = await fetch("/api/admin/gacha-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName.trim() }),
            });
            const json = await res.json() as { success: boolean };
            if (json.success) { showSuccess("เพิ่มหมวดหมู่แล้ว"); setNewCatName(""); void loadAll(); }
            else showError("เพิ่มไม่สำเร็จ");
        } catch { showError("เกิดข้อผิดพลาด"); } finally { setSavingCat(false); }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("ลบหมวดหมู่นี้?")) return;
        await fetch(`/api/admin/gacha-categories/${id}`, { method: "DELETE" });
        void loadAll();
    };

    const addMachine = async () => {
        if (!machineForm.name.trim()) return showError("ต้องใส่ชื่อตู้กาชา");
        setSavingMachine(true);
        try {
            const res = await fetch("/api/admin/gacha-machines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...machineForm, categoryId: machineForm.categoryId || null }),
            });
            const json = await res.json() as { success: boolean };
            if (json.success) {
                showSuccess("เพิ่มตู้กาชาแล้ว");
                setShowMachineForm(false);
                setMachineForm({ name: "", imageUrl: "", categoryId: "", costType: "FREE", costAmount: 0, dailySpinLimit: 0, sortOrder: 0 });
                void loadAll();
            } else showError("เพิ่มไม่สำเร็จ");
        } catch { showError("เกิดข้อผิดพลาด"); } finally { setSavingMachine(false); }
    };

    const toggleMachine = async (id: string, field: "isActive" | "isEnabled", val: boolean) => {
        await fetch(`/api/admin/gacha-machines/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: val }),
        });
        void loadAll();
    };

    const deleteMachine = async (id: string) => {
        if (!confirm("ลบตู้กาชานี้?")) return;
        await fetch(`/api/admin/gacha-machines/${id}`, { method: "DELETE" });
        void loadAll();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">หมวดหมู่กาชา</h1>
                <p className="text-sm text-muted-foreground mt-1">จัดการหมวดหมู่และตู้กาชาสำหรับหน้า /gachapons</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Categories */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-[#1a56db] text-white px-5 py-3 font-bold flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" /> หมวดหมู่
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="ชื่อหมวดหมู่ใหม่..."
                                    className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => void addCategory()}
                                    disabled={savingCat}
                                    className="px-3 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-md hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
                                >
                                    {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} เพิ่ม
                                </button>
                            </div>
                            {categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีหมวดหมู่</p>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{cat.name}</p>
                                            <p className="text-xs text-muted-foreground">{cat._count.machines} ตู้</p>
                                        </div>
                                        <button onClick={() => void deleteCategory(cat.id)} className="text-red-400 hover:text-red-600 transition p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Machines */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-[#1a56db] text-white px-5 py-3 font-bold flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> ตู้กาชา</span>
                            <button onClick={() => setShowMachineForm(v => !v)} className="text-white/80 hover:text-white transition">
                                {showMachineForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                        {showMachineForm && (
                            <div className="border-b border-border p-4 space-y-2 bg-blue-50/50 dark:bg-blue-900/10">
                                <input value={machineForm.name} onChange={e => setMachineForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อตู้กาชา *" className="w-full text-sm border border-border rounded px-3 py-2 bg-background" />
                                <input value={machineForm.imageUrl} onChange={e => setMachineForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="URL รูปภาพ" className="w-full text-sm border border-border rounded px-3 py-2 bg-background" />
                                <select value={machineForm.categoryId} onChange={e => setMachineForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full text-sm border border-border rounded px-3 py-2 bg-background">
                                    <option value="">-- ไม่มีหมวดหมู่ --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <select value={machineForm.costType} onChange={e => setMachineForm(f => ({ ...f, costType: e.target.value }))} className="flex-1 text-sm border border-border rounded px-3 py-2 bg-background">
                                        <option value="FREE">ฟรี</option>
                                        <option value="CREDIT">เครดิต</option>
                                        <option value="POINT">พอยต์</option>
                                    </select>
                                    {machineForm.costType !== "FREE" && (
                                        <input type="number" value={machineForm.costAmount} onChange={e => setMachineForm(f => ({ ...f, costAmount: Number(e.target.value) }))} placeholder="ราคา" min={0} className="flex-1 text-sm border border-border rounded px-3 py-2 bg-background" />
                                    )}
                                </div>
                                <button onClick={() => void addMachine()} disabled={savingMachine} className="w-full py-2 bg-[#1a56db] text-white text-sm font-medium rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                    {savingMachine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} เพิ่มตู้กาชา
                                </button>
                            </div>
                        )}
                        <div className="p-4 space-y-2">
                            {machines.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีตู้กาชา กด + เพื่อเพิ่ม</p>
                            ) : (
                                machines.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                                        {m.imageUrl ? (
                                            <img src={m.imageUrl} alt={m.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                <LayoutGrid className="w-5 h-5 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                                            <p className="text-xs text-muted-foreground">{m.category?.name ?? "ไม่มีหมวดหมู่"} • {m._count.rewards} รางวัล</p>
                                            <p className="text-xs text-blue-500">{m.costType === "FREE" ? "ฟรี" : `${Number(m.costAmount).toLocaleString()} ${m.costType === "CREDIT" ? "เครดิต" : "พอยต์"}`}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => void toggleMachine(m.id, "isActive", !m.isActive)} title="Active" className={`text-xs px-2 py-1 rounded ${m.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
                                                {m.isActive ? "แสดง" : "ซ่อน"}
                                            </button>
                                            <button onClick={() => void deleteMachine(m.id)} className="text-red-400 hover:text-red-600 p-1.5 transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
