/**
 * Permission-based Access Control System
 * Supports roles with default permissions and custom per-user permissions
 */

// Available permissions in the system
export const PERMISSIONS = {
    // Product permissions
    PRODUCT_VIEW: "product:view",
    PRODUCT_CREATE: "product:create",
    PRODUCT_EDIT: "product:edit",
    PRODUCT_DELETE: "product:delete",

    // User permissions
    USER_VIEW: "user:view",
    USER_EDIT: "user:edit",
    USER_DELETE: "user:delete",
    USER_MANAGE_ROLE: "user:manage_role",

    // Order permissions
    ORDER_VIEW: "order:view",
    ORDER_VIEW_ALL: "order:view_all",

    // Topup/Slip permissions
    SLIP_VIEW: "slip:view",
    SLIP_APPROVE: "slip:approve",
    SLIP_REJECT: "slip:reject",

    // Settings permissions
    SETTINGS_VIEW: "settings:view",
    SETTINGS_EDIT: "settings:edit",

    // Admin permissions
    ADMIN_PANEL: "admin:panel",
    AUDIT_LOG_VIEW: "audit:view",
    API_KEY_MANAGE: "apikey:manage",

    // New granular admin section permissions
    MANAGE_PRODUCTS: "manage_products",
    MANAGE_PRODUCT_CODES: "manage_product_codes",
    MANAGE_CATEGORY_BANNERS: "manage_category_banners",
    MANAGE_NEWS: "manage_news",
    MANAGE_HELP: "manage_help",
    MANAGE_USERS: "manage_users",
    MANAGE_ROLES: "manage_roles",
    MANAGE_SLIPS: "manage_slips",
    MANAGE_PROMO_CODES: "manage_promo_codes",
    MANAGE_REFERRAL: "manage_referral",
    MANAGE_CURRENCY: "manage_currency",
    MANAGE_FOOTER_LINKS: "manage_footer_links",
    MANAGE_NAV_ITEMS: "manage_nav_items",
    MANAGE_SITE_SETTINGS: "manage_site_settings",
    VIEW_AUDIT_LOGS: "view_audit_logs",
    VIEW_DASHBOARD: "view_dashboard",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    USER: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.ORDER_VIEW,
    ],

    SELLER: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ADMIN_PANEL,
    ],

    MODERATOR: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.SLIP_VIEW,
        PERMISSIONS.SLIP_APPROVE,
        PERMISSIONS.SLIP_REJECT,
        PERMISSIONS.ORDER_VIEW_ALL,
        PERMISSIONS.ADMIN_PANEL,
    ],

    ADMIN: [
        // Admin has all permissions
        ...Object.values(PERMISSIONS),
    ],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a user (role permissions + custom permissions)
 */
export function getUserPermissions(role: string, customPermissions?: string | null): Permission[] {
    const rolePerms = ROLE_PERMISSIONS[role] || [];

    if (!customPermissions) {
        return rolePerms;
    }

    try {
        const custom = JSON.parse(customPermissions) as string[];
        // Combine and deduplicate
        return [...new Set([...rolePerms, ...custom])] as Permission[];
    } catch {
        return rolePerms;
    }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
    role: string,
    permission: Permission,
    customPermissions?: string | null
): boolean {
    // Admin always has all permissions
    if (role === "ADMIN") return true;

    const userPermissions = getUserPermissions(role, customPermissions);
    return userPermissions.includes(permission);
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(
    role: string,
    permissions: Permission[],
    customPermissions?: string | null
): boolean {
    return permissions.every(p => hasPermission(role, p, customPermissions));
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(
    role: string,
    permissions: Permission[],
    customPermissions?: string | null
): boolean {
    return permissions.some(p => hasPermission(role, p, customPermissions));
}

/**
 * Add custom permission to a user's permission JSON
 */
export function addCustomPermission(
    currentPermissions: string | null,
    newPermission: Permission
): string {
    const permissions = currentPermissions ? JSON.parse(currentPermissions) : [];
    if (!permissions.includes(newPermission)) {
        permissions.push(newPermission);
    }
    return JSON.stringify(permissions);
}

/**
 * Remove custom permission from a user's permission JSON
 */
export function removeCustomPermission(
    currentPermissions: string | null,
    permissionToRemove: Permission
): string {
    if (!currentPermissions) return "[]";

    const permissions = JSON.parse(currentPermissions) as string[];
    const filtered = permissions.filter(p => p !== permissionToRemove);
    return JSON.stringify(filtered);
}

// Permission labels for UI
export const PERMISSION_LABELS: Record<string, string> = {
    [PERMISSIONS.MANAGE_PRODUCTS]: "จัดการสินค้า",
    [PERMISSIONS.MANAGE_PRODUCT_CODES]: "จัดการรหัสสินค้า",
    [PERMISSIONS.MANAGE_CATEGORY_BANNERS]: "จัดการแบนเนอร์",
    [PERMISSIONS.MANAGE_NEWS]: "จัดการข่าวสาร",
    [PERMISSIONS.MANAGE_HELP]: "จัดการศูนย์ช่วยเหลือ",
    [PERMISSIONS.MANAGE_USERS]: "จัดการผู้ใช้",
    [PERMISSIONS.MANAGE_ROLES]: "จัดการยศ",
    [PERMISSIONS.MANAGE_SLIPS]: "ตรวจสอบสลิป",
    [PERMISSIONS.MANAGE_PROMO_CODES]: "จัดการโค้ดส่วนลด",
    [PERMISSIONS.MANAGE_REFERRAL]: "ระบบแนะนำเพื่อน",
    [PERMISSIONS.MANAGE_CURRENCY]: "ตั้งค่าสกุลเงิน",
    [PERMISSIONS.MANAGE_FOOTER_LINKS]: "ลิงก์ท้ายเว็บ",
    [PERMISSIONS.MANAGE_NAV_ITEMS]: "จัดการเมนูนำทาง",
    [PERMISSIONS.MANAGE_SITE_SETTINGS]: "ตั้งค่าเว็บไซต์",
    [PERMISSIONS.VIEW_AUDIT_LOGS]: "บันทึกการใช้งาน",
    [PERMISSIONS.VIEW_DASHBOARD]: "แดชบอร์ด",
};

// Permission groups for better UI organization
export const PERMISSION_GROUPS = [
    {
        name: "สินค้าและเนื้อหา",
        permissions: [
            PERMISSIONS.MANAGE_PRODUCTS,
            PERMISSIONS.MANAGE_PRODUCT_CODES,
            PERMISSIONS.MANAGE_CATEGORY_BANNERS,
            PERMISSIONS.MANAGE_NEWS,
            PERMISSIONS.MANAGE_HELP,
        ],
    },
    {
        name: "ผู้ใช้และยศ",
        permissions: [
            PERMISSIONS.MANAGE_USERS,
            PERMISSIONS.MANAGE_ROLES,
        ],
    },
    {
        name: "การเงินและโปรโมชั่น",
        permissions: [
            PERMISSIONS.MANAGE_SLIPS,
            PERMISSIONS.MANAGE_PROMO_CODES,
            PERMISSIONS.MANAGE_CURRENCY,
        ],
    },
    {
        name: "การตั้งค่าและระบบ",
        permissions: [
            PERMISSIONS.MANAGE_REFERRAL,
            PERMISSIONS.MANAGE_FOOTER_LINKS,
            PERMISSIONS.MANAGE_NAV_ITEMS,
            PERMISSIONS.MANAGE_SITE_SETTINGS,
        ],
    },
    {
        name: "การดูแลระบบ",
        permissions: [
            PERMISSIONS.VIEW_AUDIT_LOGS,
            PERMISSIONS.VIEW_DASHBOARD,
        ],
    },
];

