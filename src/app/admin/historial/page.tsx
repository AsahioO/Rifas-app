"use client";

import { useEffect, useState } from "react";
import { Clock, Trophy, Search, Loader2, X, Activity, Ticket, Users } from "lucide-react";
import { mockStore, type Raffle } from "@/lib/store";

export default function HistorialPage() {
    const [raffles, setRaffles] = useState<Raffle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
    const [selectedStats, setSelectedStats] = useState<Awaited<ReturnType<typeof mockStore.getFinancialStatsForRaffle>> | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

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

    const openModal = async (raffle: Raffle) => {
        setSelectedRaffle(raffle);
        setLoadingStats(true);
        const stats = await mockStore.getFinancialStatsForRaffle(raffle.id, raffle.precio_boleto, raffle.total_boletos);
        setSelectedStats(stats);
        setLoadingStats(false);
    };

    const closeModal = () => {
        setSelectedRaffle(null);
        setSelectedStats(null);
    };

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
                        <div
                            key={raffle.id}
                            onClick={() => openModal(raffle)}
                            className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden group border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                        >

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

            {/* Modal de Detalles Históricos */}
            {selectedRaffle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#09090b] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">

                        {/* Header del Modal */}
                        <div className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-syne font-bold text-white flex items-center gap-3">
                                    {selectedRaffle.nombre}
                                    {selectedRaffle.ganador_nombre === 'Cancelada' ? (
                                        <span className="bg-red-500/10 text-red-500/80 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                                            Cancelada
                                        </span>
                                    ) : (
                                        <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                                            Finalizada
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Finalizada el {new Date(selectedRaffle.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="p-6 md:p-8 space-y-8">

                            {/* General Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Imagen de la rifa */}
                                <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 aspect-video relative">
                                    {selectedRaffle.fotos && selectedRaffle.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selectedRaffle.fotos[0]} alt={selectedRaffle.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <Trophy className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>

                                {/* Resumen del Sorteo */}
                                <div className="space-y-6">
                                    {selectedRaffle.ganador_nombre !== 'Cancelada' && (
                                        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                                            <p className="text-xs uppercase tracking-widest text-primary font-syne mb-2">Gran Ganador</p>
                                            <div className="flex items-end gap-3">
                                                <h3 className="text-2xl font-bold text-white">{selectedRaffle.ganador_nombre || 'Sin registrar'}</h3>
                                                {selectedRaffle.ganador_boleto && (
                                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-lg font-bold border border-primary/20">
                                                        #{selectedRaffle.ganador_boleto}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="glass-panel p-4 rounded-xl border-white/5 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                <Ticket className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Precio</p>
                                                <p className="font-bold font-syne text-white">${selectedRaffle.precio_boleto}</p>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-4 rounded-xl border-white/5 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Boletos Totales</p>
                                                <p className="font-bold font-syne text-white">{selectedRaffle.total_boletos}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedRaffle.descripcion}
                                    </p>
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-white/10 my-4" />

                            {/* Finanzas */}
                            <div>
                                <h3 className="font-syne font-bold text-xl flex items-center gap-2 mb-6">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                    Resumen Financiero Histórico
                                </h3>

                                {loadingStats ? (
                                    <div className="h-32 flex items-center justify-center glass-panel rounded-2xl border-white/5">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                    </div>
                                ) : selectedStats ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="glass-panel p-5 rounded-2xl border-emerald-500/10 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                                            <p className="text-sm text-muted-foreground mb-1">Ingresos de la Rifa</p>
                                            <h4 className="text-2xl font-syne font-bold text-emerald-400">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(selectedStats.ingresosBrutos)}
                                            </h4>
                                            <p className="text-xs text-emerald-500/70 mt-2">{selectedStats.boletosVendidos} boletos pagados</p>
                                        </div>

                                        <div className="glass-panel p-5 rounded-2xl border-blue-500/10">
                                            <p className="text-sm text-muted-foreground mb-1">Proyección Alcanzada</p>
                                            <h4 className="text-2xl font-syne font-bold text-white">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(selectedStats.ingresosProyectados)}
                                            </h4>
                                            <div className="mt-2 w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.min(100, (selectedStats.ingresosBrutos / selectedStats.ingresosProyectados) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-muted-foreground bg-white/5 rounded-xl text-sm">
                                        No se pudieron cargar las estadísticas financieras para esta rifa.
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
