"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setError("Credenciales inválidas. Verifica tu correo y contraseña.");
            } else {
                router.push("/admin");
                router.refresh();
            }
        } catch {
            setError("Error interno. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-bg relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-brand-surface border border-brand-border shadow-sm p-8 sm:p-10 rounded-3xl z-10 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-accent/10 text-brand-text mb-4 border border-brand-border shadow-sm">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-brand-text">Admin Login</h1>
                    <p className="text-brand-muted text-sm">Ingresa para gestionar las rifas.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-muted">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all placeholder:text-brand-muted/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-muted">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all placeholder:text-brand-muted/50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-text hover:bg-black text-brand-surface font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Ingresar al Dashboard
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <a href="/" className="text-sm text-brand-muted hover:text-brand-text transition-colors font-medium">
                        ← Volver a la página pública
                    </a>
                </div>
            </div>
        </div>
    );
}
