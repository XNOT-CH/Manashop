import { z } from "zod";

// Schema สำหรับที่อยู่ (ใช้ร่วมกันทั้งใบกำกับภาษีและจัดส่ง)
const addressSchema = z.object({
    fullName: z.string().max(200).optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
    province: z.string().max(100).optional().or(z.literal("")),
    district: z.string().max(100).optional().or(z.literal("")),
    subdistrict: z.string().max(100).optional().or(z.literal("")),
    postalCode: z.string().max(10).optional().or(z.literal("")),
});

// Schema สำหรับอัปเดตโปรไฟล์
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(1, "กรุณากรอกชื่อ")
        .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
    email: z
        .string()
        .email("กรุณากรอกอีเมลให้ถูกต้อง")
        .or(z.literal("")), // อนุญาตให้ว่างได้
    phone: z
        .string()
        .max(20, "เบอร์มือถือต้องไม่เกิน 20 ตัวอักษร")
        .optional()
        .or(z.literal("")),
    image: z
        .string()
        .url("กรุณากรอก URL รูปภาพให้ถูกต้อง")
        .or(z.literal(""))
        .optional(), // Optional profile image URL
    // ข้อมูลส่วนตัว
    firstName: z.string().max(100).optional().or(z.literal("")),
    lastName: z.string().max(100).optional().or(z.literal("")),
    firstNameEn: z.string().max(100).optional().or(z.literal("")),
    lastNameEn: z.string().max(100).optional().or(z.literal("")),
    // ที่อยู่
    taxAddress: addressSchema.optional(),
    shippingAddress: addressSchema.optional(),
    password: z
        .string()
        .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        .or(z.literal("")) // อนุญาตให้ว่างได้ (ใช้รหัสเดิม)
        .optional(),
    confirmPassword: z
        .string()
        .optional(),
}).refine((data) => {
    // ถ้ากรอก password ต้องกรอก confirmPassword ให้ตรงกัน
    if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
