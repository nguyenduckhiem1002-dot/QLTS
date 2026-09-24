import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { getTranslations } from "@/lib/i18n";
import "./globals.css";

// Be Vietnam Pro is drawn for Vietnamese diacritics; JetBrains Mono for codes and serials.
const sans = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["500", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-mono",
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
    <html lang={locale} className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          {t("common.skipToContent")}
        </a>
        {children}
      </body>
    </html>
  );
}
