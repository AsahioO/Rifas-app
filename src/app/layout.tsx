import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastContainer } from "@/components/ui/Toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F5F2",
};

export const metadata: Metadata = {
  title: "WhatsHome Rifas | Gana grandes premios",
  description: "Participa en nuestras exclusivas rifas y gana increíbles productos.",
  appleWebApp: {
    statusBarStyle: "default",
    title: "WhatsHome Rifas",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-sans antialiased text-brand-text min-h-screen bg-brand-bg")}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
