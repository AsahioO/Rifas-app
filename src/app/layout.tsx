import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "WhatsHome Rifas | Gana grandes premios",
  description: "Participa en nuestras exclusivas rifas y gana increíbles productos.",
  appleWebApp: {
    capable: true,
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
    <html lang="es" className="dark scroll-smooth">
      <body className={cn(inter.variable, "font-sans antialiased text-foreground min-h-screen bg-background")}>
        {children}
      </body>
    </html>
  );
}
