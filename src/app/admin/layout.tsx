"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Ticket, Users, History, Settings, LogOut, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const navigation = [
        { name: "Resumen", href: "/admin", icon: LayoutDashboard },
        { name: "Sorteo", href: "/admin/sorteo", icon: Ticket },
        { name: "Usuarios", href: "/admin/participantes", icon: Users },
        { name: "Historial", href: "/admin/historial", icon: History },
        { name: "Finanzas", href: "/admin/finanzas", icon: DollarSign },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    };

    const isLoginPage = pathname === "/admin/login";

    if (isLoginPage) {
        return <div className="min-h-screen bg-brand-bg">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row pb-[80px] md:pb-0">
            {/* MOBILE HEADER */}
            <div className="md:hidden flex items-center justify-between p-4 bg-brand-surface border-b border-brand-border sticky top-0 z-40">
                <span className="font-serif font-bold text-xl text-brand-text">Dashboard</span>
                <button onClick={handleLogout} className="p-2 text-brand-sale hover:bg-brand-sale/10 active:bg-brand-sale/20 rounded-lg transition-colors">
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            {/* SIDEBAR (Desktop) */}
            <nav className={`
        hidden md:flex flex-col w-64 bg-brand-surface border-r border-brand-border 
        sticky top-0 h-dvh z-40 shadow-sm
      `}>
                <div className="flex p-6 items-center gap-2 border-b border-brand-border">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-serif font-bold text-xl text-brand-text">Admin</span>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-brand-accent/10 text-brand-accent font-bold border border-brand-accent/20'
                                    : 'text-brand-muted hover:bg-brand-wine/5 hover:text-brand-wine'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-accent' : ''}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-brand-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-brand-sale hover:bg-brand-sale/10 transition-all font-bold"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* BOTTOM NAVIGATION (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border z-50 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pt-2">
                <div className="flex justify-around items-center px-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px] ${isActive
                                    ? 'text-brand-accent'
                                    : 'text-brand-muted active:bg-brand-muted/10'
                                    }`}
                            >
                                <div className={`relative ${isActive ? 'animate-in zoom-in duration-300' : ''}`}>
                                    <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-brand-accent drop-shadow-sm' : ''}`} />
                                    {isActive && (
                                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-accent rounded-full" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium truncate w-full text-center leading-tight mt-1 ${isActive ? 'font-bold' : ''}`}>
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto md:h-dvh">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
