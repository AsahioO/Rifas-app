import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastContainer } from "@/components/ui/Toast";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F4EE",
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
      <head><meta name="mobile-web-app-capable" content="yes" /></head>
      <body className={cn(geist.variable, geistMono.variable, "font-sans antialiased text-brand-text min-h-screen bg-brand-bg")}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
