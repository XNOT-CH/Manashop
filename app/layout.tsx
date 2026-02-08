import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DynamicBackground } from "@/components/DynamicBackground";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartProvider } from "@/components/providers/CartContext";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { SweetAlertProvider } from "@/components/SweetAlertProvider";
import { AnnouncementPopupWrapper } from "@/components/AnnouncementPopupWrapper";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameStore - Game ID Marketplace",
  description: "แหล่งซื้อขายไอดีเกมที่ปลอดภัยที่สุด",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider>
          <SweetAlertProvider>
            <CartProvider>
              {/* Dynamic Background Image */}
              <DynamicBackground />

              {/* Dynamic Favicon from Settings */}
              <DynamicFavicon />

              {/* Navbar */}
              <Navbar />

              {/* Main Content - Responsive Container with Page Transition */}
              <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <main className="animate-page-enter">
                  {children}
                </main>
              </div>

              {/* Footer */}
              <Footer />

              {/* Floating Chat Button */}
              <FloatingChatButton href="https://m.me/61571169820803" />

              {/* Announcement Popup - Client Side Only */}
              <AnnouncementPopupWrapper />
            </CartProvider>
          </SweetAlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


