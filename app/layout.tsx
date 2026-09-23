import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getTranslations } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Casla Assets",
    template: "%s | Casla Assets",
  },
  description: "Hệ thống quản lý tài sản nội bộ Casla",
  icons: {
    icon: "/casla-mark.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getTranslations();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          {t("common.skipToContent")}
        </a>
        {children}
      </body>
    </html>
  );
}
