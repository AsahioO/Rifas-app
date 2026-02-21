"use client";

import { useEffect, useState } from "react";
import { Clock, Trophy, Search, Loader2 } from "lucide-react";
import { mockStore, type Raffle } from "@/lib/store";

export default function HistorialPage() {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await mockStore.getHistoricalRaffles();
            setRaffles(data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const filteredRaffles = raffles.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ganador_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold">Historial de Rifas</h1>
                    <p className="text-muted-foreground">Consulta los sorteos pasados y sus ganadores.</p>
                </div>

                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por premio o ganador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-80 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            {filteredRaffles.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold font-syne text-white">No hay historial</h2>
                    <p className="text-muted-foreground">Las rifas que finalices aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredRaffles.map((raffle) => (
                        <div key={raffle.id} className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden group border border-white/5 hover:border-primary/30 transition-all">

                            {/* Decoración Vinoso/Dorado */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="font-syne text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{raffle.nombre}</h3>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(raffle.created_at).toLocaleDateString('es-MX', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </div>
                                </div>

                                {raffle.ganador_nombre === 'Cancelada' ? (
                                    <div className="bg-red-500/10 text-red-500/80 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                                        Cancelada
                                    </div>
                                ) : (
                                    <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30 flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                                        <Trophy className="w-3 h-3" />
                                        Finalizada
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-zinc-900 rounded-xl overflow-hidden border border-white/5 shrink-0">
                                    {raffle.fotos && raffle.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={raffle.fotos[0]} alt={raffle.nombre} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center flex-col text-white/20">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 flex-1">
                                    {raffle.ganador_nombre !== 'Cancelada' && (
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-syne mb-1">Gran Ganador</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-white max-w-[150px] sm:max-w-[200px] truncate">{raffle.ganador_nombre || 'Sin registrar'}</span>
                                                {raffle.ganador_boleto && (
                                                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-sm font-bold border border-primary/20">
                                                        #{raffle.ganador_boleto}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div>
                                            <span className="text-white/60">Boletos:</span> {raffle.total_boletos}
                                        </div>
                                        <div>
                                            <span className="text-white/60">Precio:</span> ${raffle.precio_boleto}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
