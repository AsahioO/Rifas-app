"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, Ticket, ArrowRight, Activity, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { mockStore, type Raffle, type Participant } from "@/lib/store";

export default function AdminDashboardPage() {
    const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
    const [lastFinished, setLastFinished] = useState<Raffle | null>(null);
    const [draftRaffles, setDraftRaffles] = useState<Raffle[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [takenTickets, setTakenTickets] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [editData, setEditData] = useState<Partial<Raffle>>({});
    const [financialStats, setFinancialStats] = useState<Awaited<ReturnType<typeof mockStore.getFinancialStats>> | null>(null);

    const fetchStats = async () => {
        const drafts = await mockStore.getDraftRaffles();
        setDraftRaffles(drafts);

        const raffle = await mockStore.getActiveRaffle();
        setActiveRaffle(raffle);
        if (raffle) {
            setParticipants(await mockStore.getParticipants());
            setTakenTickets(await mockStore.getTakenTickets());
            setFinancialStats(await mockStore.getFinancialStats());
        } else {
            // Si no hay activa, revisar si hay una recién finalizada para mostrar panel de archivo
            const finished = await mockStore.getLastFinishedRaffle();
            setLastFinished(finished);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = async () => {
        if (confirm("¿Estás seguro de eliminar esta rifa y todos sus participantes? Esta acción no se puede deshacer.")) {
            await mockStore.resetStore();
            window.location.reload();
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await mockStore.updateActiveRaffle(editData);
        setShowEdit(false);
        fetchStats();
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando datos...</div>;

    // Calcular boleto más vendido (Simulado - el que tiene más interesados, aunque aquí es estricto 1 persona 1 boleto, lo dejamos como stats visual de último vendido o dummy por ahora)
    const mostSold = takenTickets.length > 0 ? takenTickets[takenTickets.length - 1] : "--";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold">Resumen de Rifas</h1>
                    <p className="text-muted-foreground">Bienvenida al panel de administración.</p>
                </div>
                {!activeRaffle && !lastFinished && (
                    <Link href="/admin/rifa/nueva" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Plus className="w-5 h-5" />
                        Crear Nueva Rifa
                    </Link>
                )}
            </div>

            {/* Drafts Section */}
            {draftRaffles.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-syne font-bold flex items-center gap-2">
                        <Edit className="w-5 h-5 text-gray-400" /> Rifas en Borrador
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {draftRaffles.map(draft => (
                            <div key={draft.id} className="glass-panel p-5 rounded-2xl border-white/10 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white truncate pr-4">{draft.nombre}</h3>
                                    <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-500/30">Borrador</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{draft.descripcion}</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Link
                                        href={`/admin/rifa/nueva?id=${draft.id}`}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10 text-center flex items-center justify-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" /> Editar
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            const { error } = await mockStore.updateRaffle(draft.id, { estado: 'activa' });
                                            if (error) alert(error.message);
                                            else fetchStats();
                                        }}
                                        className="flex-1 bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-primary/30 text-center"
                                    >
                                        Publicar Ahora
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Caso: Hay una rifa recién finalizada pendiente de archivar */}
            {!activeRaffle && lastFinished ? (
                <div className="glass-panel rounded-3xl p-10 border-yellow-500/20 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden group bg-yellow-500/5">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 ring-1 ring-yellow-500/30 z-10 mb-2">
                        <Trophy className="w-10 h-10" />
                    </div>
                    <h3 className="font-syne font-bold text-3xl text-yellow-500">¡Sorteo Concluido!</h3>
                    <p className="text-muted-foreground pb-4">
                        {lastFinished.ganador_nombre === 'Cancelada' ? (
                            <>La rifa <strong className="text-white">{lastFinished.nombre}</strong> fue cancelada.</>
                        ) : (
                            <>Ganador: <strong className="text-white text-lg">{lastFinished.ganador_nombre}</strong> con el boleto <strong className="text-yellow-500 text-lg">#{lastFinished.ganador_boleto}</strong></>
                        )}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                        <Link
                            href="/admin/rifa/nueva"
                            className="z-10 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-8 py-4 rounded-xl font-bold transition-all border border-yellow-500/20 hover:scale-105"
                        >
                            Crear Nueva Rifa
                        </Link>
                        {lastFinished.ganador_nombre !== 'Cancelada' && (
                            <button
                                onClick={async () => {
                                    if (confirm('¿Ocultar al ganador de la página pública? La información se conservará en el historial.')) {
                                        await mockStore.archiveWinner();
                                        window.location.reload();
                                    }
                                }}
                                className="z-10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-6 py-4 rounded-xl font-medium transition-all border border-white/10 text-sm"
                            >
                                Ocultar Ganador de la Página
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-white/30 mt-4 max-w-md">El ganador se muestra en la página pública hasta que lo ocultes o crees una nueva rifa.</p>
                </div>

            ) : !activeRaffle ? (
                <div className="glass-panel border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground mb-6">
                        <Ticket className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-syne font-bold">No hay rifa activa</h3>
                    <p className="text-muted-foreground max-w-md mx-auto pb-4">
                        Para que tus clientes puedan comprar boletos en la página web, necesitas publicar un borrador o crear el próximo sorteo.
                    </p>
                    <Link href="/admin/rifa/nueva" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-xl transition-all hover:scale-105">
                        <Plus className="w-5 h-5" />
                        Configurar Primera Rifa
                    </Link>
                </div>
            ) : (
                <>
                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-primary/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-muted-foreground font-medium">Boleto más reciente</h3>
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <Trophy className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-bold font-syne">#{mostSold}</h2>
                                <p className="text-sm text-primary mt-1">Último número apartado</p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-muted-foreground font-medium">Boletos Reservados</h3>
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Ticket className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-bold font-syne">{takenTickets.length}</h2>
                                <p className="text-sm text-blue-400 mt-1">de {activeRaffle.total_boletos} disponibles</p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[30px] -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-muted-foreground font-medium">Participantes</h3>
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-bold font-syne">{participants.length}</h2>
                                <p className="text-sm text-purple-400 mt-1">Registrados activos</p>
                            </div>
                        </div>

                        <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden group ${activeRaffle.estado === 'activa' ? 'border-primary/30' : 'border-yellow-500/30'}`}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h3 className={`${activeRaffle.estado === 'activa' ? 'text-primary' : 'text-yellow-500'} font-medium flex items-center gap-2`}>
                                    Estado Actual <Activity className="w-4 h-4" />
                                </h3>
                                {activeRaffle.estado === 'activa' && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditData(activeRaffle); setShowEdit(true); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Editar Rifa">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={handleDelete} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-colors" title="Cancelar Rifa">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="relative z-10">
                                <h2 className={`text-2xl font-bold font-syne uppercase tracking-wider block truncate ${activeRaffle.estado === 'activa' ? 'text-glow' : 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`}>
                                    {activeRaffle.estado === 'activa' ? 'Activa' : 'Finalizada'}
                                </h2>
                                <p className="text-sm text-white/50 mt-1 truncate">{activeRaffle.nombre}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                        <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-syne font-bold text-xl">Últimos Registros</h3>
                                <Link href="/admin/participantes" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    Ver todos <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {participants.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground italic flex-1 flex items-center justify-center">
                                    Aún no hay participantes registrados.
                                </div>
                            ) : (
                                <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[300px]">
                                    {participants.slice().reverse().slice(0, 5).map((p) => (
                                        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs px-1 text-center leading-tight">
                                                    #{p.boletos.length > 2 ? `${p.boletos[0]}...` : p.boletos.join(',')}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white/90">{p.nombre}</h4>
                                                    <p className="text-xs text-muted-foreground">Boletos: {p.boletos.length} reservados</p>
                                                </div>
                                            </div>
                                            <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto whitespace-nowrap">
                                                {p.estado}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {activeRaffle.estado === 'activa' ? (
                            <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden group h-full">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none group-hover:from-primary/20 transition-all duration-700" />
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary ring-1 ring-primary/30 z-10">
                                    <Ticket className="w-10 h-10" />
                                </div>
                                <div className="z-10">
                                    <h3 className="font-syne font-bold text-2xl mb-2">Prepara el Sorteo</h3>
                                    <p className="text-muted-foreground text-balance max-w-sm mx-auto">
                                        Cuando vendas todos los boletos, podrás iniciar la ruleta desde aquí.
                                    </p>
                                </div>
                                <Link href="/admin/sorteo" className="z-10 bg-white/5 border border-white/10 text-white/50 px-8 py-3 rounded-full font-medium transition-colors hover:bg-white/10 hover:text-white">
                                    Ir al Panel de Sorteo
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {/* QUICK FINANCIAL SUMMARY */}
                    {financialStats && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-syne font-bold text-xl flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                    Resumen Financiero
                                </h3>
                                <Link href="/admin/finanzas" className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-full">
                                    Ver gráficas y detalles <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-panel p-5 rounded-2xl border-emerald-500/10 flex flex-col justify-center">
                                    <p className="text-sm text-muted-foreground mb-1">Ingresos de la Rifa</p>
                                    <h4 className="text-2xl font-syne font-bold text-emerald-400">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(financialStats.ingresosBrutos)}
                                    </h4>
                                </div>
                                <div className="glass-panel p-5 rounded-2xl border-blue-500/10 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                                    <p className="text-sm text-muted-foreground mb-1">Proyección (Total)</p>
                                    <h4 className="text-2xl font-syne font-bold text-blue-400">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(financialStats.ingresosProyectados)}
                                    </h4>
                                    <div className="mt-2 w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${Math.min(100, (financialStats.boletosVendidos / financialStats.totalBoletos) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Edición */}
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <h3 className="text-2xl font-bold font-syne mb-6">Editar Rifa Rápida</h3>
                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground">Título de la Rifa</label>
                                <input type="text" required value={editData.nombre || ''} onChange={e => setEditData({ ...editData, nombre: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white mt-1" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">Premio General (Descripción)</label>
                                <input type="text" required value={editData.descripcion || ''} onChange={e => setEditData({ ...editData, descripcion: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-white mt-1" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
