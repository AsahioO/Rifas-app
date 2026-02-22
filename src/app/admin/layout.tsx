"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Ticket, Users, History, Settings, LogOut, Menu, X, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: "Resumen", href: "/admin", icon: LayoutDashboard },
        { name: "Sorteo Activo", href: "/admin/sorteo", icon: Ticket },
        { name: "Participantes", href: "/admin/participantes", icon: Users },
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
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* MOBILE HEADER */}
            <div className="md:hidden flex items-center justify-between p-4 glass-panel sticky top-0 z-50">
                <span className="font-syne font-bold text-xl text-white">Dashboard</span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white/70 hover:text-white">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* SIDEBAR (Desktop) / DROPDOWN MENU (Mobile) */}
            <nav className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-64 glass-panel border-r border-white/5 
        fixed md:sticky top-[72px] md:top-0 h-[calc(100dvh-72px)] md:h-dvh z-40
        transition-all duration-300 pb-[env(safe-area-inset-bottom)]
      `}>
                <div className="hidden md:flex p-6 items-center gap-2 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-syne font-bold text-xl">Admin</span>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto h-[calc(100dvh-72px)] md:h-dvh pb-24 md:pb-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
