"use client";

import { useEffect, useState } from "react";
import { Clock, Trophy, Search, Loader2, X, Activity, Ticket, Users } from "lucide-react";
import { motion } from "framer-motion";
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
                <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-text">Historial de Rifas</h1>
                    <p className="text-brand-muted">Consulta los sorteos pasados y sus ganadores.</p>
                </div>

                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por premio o ganador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-80 bg-white border border-brand-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-brand-text placeholder:text-brand-muted/70"
                    />
                </div>
            </div>

            {filteredRaffles.length === 0 ? (
                <div className="bg-brand-surface border border-brand-border shadow-sm p-16 rounded-3xl text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center text-brand-muted">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-brand-text">No hay historial</h2>
                    <p className="text-brand-muted">Las rifas que finalices aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredRaffles.map((raffle, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileTap={{ scale: 0.98 }}
                            key={raffle.id}
                            onClick={() => openModal(raffle)}
                            className="bg-brand-surface shadow-sm p-6 sm:p-8 rounded-3xl relative overflow-hidden group border border-brand-border hover:border-brand-accent/30 hover:shadow-md transition-all cursor-pointer"
                        >

                            {/* Decoración Vinoso/Dorado */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="font-serif text-xl font-bold text-brand-text mb-1 group-hover:text-brand-accent transition-colors">{raffle.nombre}</h3>
                                    <div className="text-xs text-brand-muted flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(raffle.created_at).toLocaleDateString('es-MX', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </div>
                                </div>

                                {raffle.ganador_nombre === 'Cancelada' ? (
                                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                                        Cancelada
                                    </div>
                                ) : (
                                    <div className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full text-xs font-bold border border-brand-accent/20 flex items-center gap-1 shadow-sm">
                                        <Trophy className="w-3 h-3" />
                                        Finalizada
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-brand-border to-transparent my-6" />

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-brand-bg rounded-xl overflow-hidden border border-brand-border shrink-0">
                                    {raffle.fotos && raffle.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={raffle.fotos[0]} alt={raffle.nombre} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center flex-col text-brand-muted">
                                            <Trophy className="w-6 h-6 border-transparent" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 flex-1">
                                    {raffle.ganador_nombre !== 'Cancelada' && (
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-1">Gran Ganador</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-brand-text max-w-[150px] sm:max-w-[200px] truncate">{raffle.ganador_nombre || 'Sin registrar'}</span>
                                                {raffle.ganador_boleto && (
                                                    <span className="bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded text-sm font-bold border border-brand-accent/20">
                                                        #{raffle.ganador_boleto}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-brand-muted font-medium">
                                        <div>
                                            <span className="text-brand-muted/70">Boletos:</span> {raffle.total_boletos}
                                        </div>
                                        <div>
                                            <span className="text-brand-muted/70">Precio:</span> ${raffle.precio_boleto}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de Detalles Históricos */}
            {selectedRaffle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-brand-surface w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-brand-border shadow-2xl animate-in zoom-in-95 duration-300">

                        {/* Header del Modal */}
                        <div className="sticky top-0 z-10 bg-brand-surface/90 backdrop-blur-md border-b border-brand-border p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-text flex items-center gap-3">
                                    {selectedRaffle.nombre}
                                    {selectedRaffle.ganador_nombre === 'Cancelada' ? (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                                            Cancelada
                                        </span>
                                    ) : (
                                        <span className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full text-xs font-bold border border-brand-accent/20">
                                            Finalizada
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-brand-muted mt-1 font-medium">
                                    Finalizada el {new Date(selectedRaffle.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full bg-brand-bg hover:bg-brand-border flex items-center justify-center text-brand-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="p-6 md:p-8 space-y-8">

                            {/* General Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Imagen de la rifa */}
                                <div className="rounded-2xl overflow-hidden bg-brand-bg border border-brand-border aspect-video relative">
                                    {selectedRaffle.fotos && selectedRaffle.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selectedRaffle.fotos[0]} alt={selectedRaffle.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-brand-muted">
                                            <Trophy className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>

                                {/* Resumen del Sorteo */}
                                <div className="space-y-6">
                                    {selectedRaffle.ganador_nombre !== 'Cancelada' && (
                                        <div className="bg-brand-bg p-6 rounded-2xl border border-brand-accent/20 shadow-sm relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />
                                            <p className="text-xs uppercase tracking-widest text-brand-accent font-medium mb-2 relative z-10">Gran Ganador</p>
                                            <div className="flex items-end gap-3 relative z-10">
                                                <h3 className="text-2xl font-bold text-brand-text">{selectedRaffle.ganador_nombre || 'Sin registrar'}</h3>
                                                {selectedRaffle.ganador_boleto && (
                                                    <span className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-lg text-lg font-bold border border-brand-accent/20 shadow-sm">
                                                        #{selectedRaffle.ganador_boleto}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-sm flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
                                                <Ticket className="w-5 h-5 text-brand-muted" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-brand-muted mb-0.5 font-medium">Precio</p>
                                                <p className="font-bold font-serif text-brand-text">${selectedRaffle.precio_boleto}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-sm flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5 text-brand-muted" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-brand-muted mb-0.5 font-medium">Boletos Totales</p>
                                                <p className="font-bold font-serif text-brand-text">{selectedRaffle.total_boletos}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-brand-muted leading-relaxed">
                                        {selectedRaffle.descripcion}
                                    </p>
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-brand-border my-4" />

                            {/* Finanzas */}
                            <div>
                                <h3 className="font-serif font-bold text-xl flex items-center gap-2 mb-6 text-brand-text">
                                    <Activity className="w-5 h-5 text-emerald-600" />
                                    Resumen Financiero Histórico
                                </h3>

                                {loadingStats ? (
                                    <div className="h-32 flex items-center justify-center bg-brand-bg rounded-2xl border border-brand-border">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                    </div>
                                ) : selectedStats ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-5 rounded-2xl border border-emerald-200 relative overflow-hidden shadow-sm">
                                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none" />
                                            <p className="text-sm text-brand-muted mb-1 font-medium">Ingresos de la Rifa</p>
                                            <h4 className="text-2xl font-serif font-bold text-emerald-700">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(selectedStats.ingresosBrutos)}
                                            </h4>
                                            <p className="text-xs text-emerald-600/80 mt-2">{selectedStats.boletosVendidos} boletos pagados</p>
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
                                            <p className="text-sm text-brand-muted mb-1 font-medium">Proyección Alcanzada</p>
                                            <h4 className="text-2xl font-serif font-bold text-brand-text">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(selectedStats.ingresosProyectados)}
                                            </h4>
                                            <div className="mt-2 w-full bg-brand-bg rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.min(100, (selectedStats.ingresosBrutos / selectedStats.ingresosProyectados) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-brand-muted bg-brand-bg rounded-xl text-sm border border-brand-border">
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
