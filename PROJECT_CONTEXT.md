# 🎮 ManaShop - Game Store E-Commerce Platform

## Overview
นี่คือโปรเจกต์ **ร้านขายเกมออนไลน์ (Game Store)** พัฒนาด้วย Next.js 16 + TypeScript สำหรับตลาดไทย รองรับระบบสมาชิก, เติมเงิน, ซื้อสินค้าดิจิตอล (Game Keys/Digital Codes) และระบบ Point สะสม

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.3 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | MySQL via Prisma ORM 5.22 |
| **Cache** | Upstash Redis |
| **Auth** | Custom Session-based (bcryptjs) |
| **UI Components** | Radix UI + shadcn/ui |
| **Animation** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Testing** | Vitest + Testing Library |

---

## Project Structure

```
my-game-store/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (REST)
│   │   ├── admin/        # Admin-only APIs (31 routes)
│   │   ├── cart/         # Shopping cart API
│   │   ├── login/        # Authentication
│   │   ├── register/     # User registration
│   │   ├── topup/        # Balance top-up
│   │   ├── purchase/     # Product purchase
│   │   ├── products/     # Product listing
│   │   ├── popups/       # Welcome popup management
│   │   └── ...           # Other APIs (~18 modules)
│   │
│   ├── admin/            # Admin Dashboard Pages
│   │   ├── products/     # จัดการสินค้า
│   │   ├── users/        # จัดการผู้ใช้
│   │   ├── slips/        # อนุมัติสลิปเติมเงิน
│   │   ├── product-codes/# คลังรหัสสินค้า
│   │   ├── promo-codes/  # โค้ดส่วนลด
│   │   ├── category-banners/ # แบนเนอร์หมวดหมู่
│   │   ├── referral/     # ตั้งค่า Referral
│   │   ├── roles/        # จัดการยศ/สิทธิ์
│   │   ├── popup-settings/ # จัดการ Popup
│   │   └── settings/     # ตั้งค่าร้าน
│   │
│   ├── dashboard/        # User Dashboard
│   ├── shop/             # หน้าร้านค้า
│   ├── product/          # หน้ารายละเอียดสินค้า
│   ├── login/            # หน้าล็อกอิน
│   ├── register/         # หน้าสมัครสมาชิก
│   └── profile/          # หน้าโปรไฟล์
│
├── components/           # React Components
│   ├── ui/              # shadcn/ui components (54 files)
│   ├── admin/           # Admin-specific components
│   ├── cart/            # Cart components
│   ├── animations/      # Animation components (FadeIn)
│   ├── Navbar.tsx       # แถบนำทาง
│   ├── Footer.tsx       # Footer
│   ├── ProductCard.tsx  # การ์ดสินค้า
│   ├── WelcomePopup.tsx # Popup ต้อนรับ
│   └── ...              # Other components (27 files)
│
├── lib/                 # Utilities & Libraries
│   ├── prisma.ts       # Prisma Client
│   ├── auth.ts         # Authentication helpers
│   ├── session.ts      # Session management
│   ├── permissions.ts  # RBAC permissions
│   ├── tierHelpers.ts  # User tier calculation
│   ├── rateLimit.ts    # API rate limiting
│   ├── cache.ts        # Redis caching
│   ├── auditLog.ts     # Activity logging
│   └── ...             # Other utilities
│
├── prisma/
│   └── schema.prisma   # Database schema
│
└── types/              # TypeScript types
```

---

## Database Schema (Key Models)

### Users & Authentication
- **User** - ผู้ใช้งาน (credit, points, referral, tier badges)
- **Role** - ยศ/สิทธิ์ (ADMIN, MODERATOR, SELLER, USER)
- **Session** - Session management
- **ApiKey** - API Keys สำหรับ External Access
- **AuditLog** - บันทึกกิจกรรม

### Products & Orders
- **Product** - สินค้า (price, discountPrice, category, currency)
- **ProductCode** - คลังรหัสเกม (inventory management)
- **Order** - คำสั่งซื้อ
- **PromoCode** - โค้ดส่วนลด

### Payments & Balance
- **Topup** - รายการเติมเงิน (slip verification)

### Content Management
- **SiteSettings** - ตั้งค่าเว็บไซต์ (hero, banners, sections)
- **Popup** - Welcome popup carousel
- **NewsArticle** - ข่าวสาร/โปรโมชั่น
- **HelpArticle** - ศูนย์ช่วยเหลือ (FAQ)
- **CategoryBanner** - แบนเนอร์หมวดหมู่
- **NavItem** - รายการเมนู
- **FooterLink** - ลิงก์ใน footer
- **CurrencySettings** - ตั้งค่าสกุลเงินพิเศษ (Point)

---

## Key Features

### 🛒 E-Commerce
- **Product Catalog** - รายการสินค้าพร้อม filters/search
- **Product Codes** - ระบบคลังรหัสเกม (auto-assign เมื่อซื้อ)
- **Shopping Cart** - ตะกร้าสินค้า
- **Promo Codes** - ส่วนลดด้วยโค้ด

### 💰 Payment & Balance
- **Credit Balance** - ยอดเงินในระบบ
- **Point System** - ระบบ Point สำหรับแลกสินค้าพิเศษ
- **Top-up** - เติมเงินผ่านสลิปโอนเงิน (manual approval)
- **Bank Settings** - ตั้งค่าบัญชีธนาคารรับเงิน

### 👤 User System
- **Registration/Login** - สมัคร/ล็อกอิน
- **User Tiers** - Bronze, Silver, Gold, Diamond, Legend (based on spending)
- **Special Badges** - Verified, Influencer badges
- **Referral System** - เชิญเพื่อนรับ Point (มี anti-abuse: IP limit)
- **Profile Settings** - ตั้งค่าโปรไฟล์, ที่อยู่จัดส่ง, ใบกำกับภาษี

### 🔐 Admin Panel
- **Dashboard** - สรุปยอดขาย/สถิติ
- **Product Management** - CRUD สินค้า
- **Product Code Management** - จัดการ/Import รหัสเกม
- **User Management** - จัดการผู้ใช้, ยศ, badges
- **Slip Approval** - อนุมัติสลิปเติมเงิน
- **Role & Permissions** - ระบบยศและสิทธิ์
- **Site Settings** - ตั้งค่าเว็บไซต์ทั้งหมด

### 🎨 Frontend Features
- **Hero Banner** - แบนเนอร์หลัก (carousel)
- **Featured Products** - สินค้าแนะนำ
- **Sale Products** - สินค้าลดราคา
- **Category Banners** - แบนเนอร์หมวดหมู่
- **Welcome Popup** - Popup ต้อนรับ (carousel, dismissable)
- **News Section** - ข่าวสาร/โปรโมชั่น
- **Dark Mode** - รองรับ Theme สว่าง/มืด
- **Animations** - FadeIn effects (Framer Motion)

---

## Running the Project

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

## Environment Variables

```env
# Database
DATABASE_URL="mysql://..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Session
SESSION_SECRET="..."
```

---

## Recent Development Focus

จากประวัติการพัฒนาล่าสุด:

1. **Multiple Popup System** - รองรับหลาย Popup แบบ carousel
2. **Referral System** - ระบบเชิญเพื่อนพร้อม anti-abuse
3. **Product Code Inventory** - คลังรหัสเกมสำหรับขาย
4. **Tier System** - ระดับสมาชิกตามยอดใช้จ่าย
5. **Promo Code System** - โค้ดส่วนลด
6. **Footer/Navigation Management** - จัดการเมนูจาก Admin
7. **Animation Components** - FadeIn scroll effects

---

## Notes for AI Assistants

- **Language**: โปรเจกต์นี้เป็นภาษาไทย (Thai market)
- **Database**: MySQL with Prisma ORM
- **Auth**: Custom session-based (ไม่ใช้ NextAuth)
- **API Pattern**: REST API ใน `app/api/`
- **Admin Check**: ใช้ `lib/auth.ts` และ `lib/permissions.ts`
- **Rate Limiting**: ใช้ Upstash Redis
- **Styling**: Tailwind CSS 4 + shadcn/ui components
