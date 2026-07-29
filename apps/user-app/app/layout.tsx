import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./components/providers";
import { AppBarClient } from "@repo/ui/AppBarClient";

export const metadata: Metadata = {
  title: "PayEase — Your Digital Wallet",
  description: "Send money, add funds, and manage your finances with PayEase — the fast, secure, and modern digital wallet.",
  keywords: ["payment", "wallet", "digital payments", "money transfer", "UPI", "India"],
  authors: [{ name: "PayEase" }],
  openGraph: {
    title: "PayEase — Your Digital Wallet",
    description: "Send money, add funds, and manage your finances instantly.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AppBarClient />
          {children}
        </Providers>
      </body>
    </html>
  );
}
