"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Ticket, Search, Loader2 } from "lucide-react";
import { mockStore, type Participant, type Raffle } from "@/lib/store";

export default function ParticipantesPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [boletosStr, setBoletosStr] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const loadData = async () => {
        const raffle = await mockStore.getActiveRaffle();
        setActiveRaffle(raffle);
        if (raffle) {
            setParticipants(await mockStore.getParticipants());
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsFormOpen(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        const numeros = boletosStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

        if (numeros.length === 0) {
            setFormError("Ingresa al menos un número válido.");
            setFormLoading(false);
            return;
        }

        // Delay manual mock
        await new Promise(r => setTimeout(r, 600));

        const { error } = await mockStore.registerParticipant(nombre, telefono, numeros);

        setFormLoading(false);

        if (error) {
            setFormError(error.message);
        } else {
            setIsFormOpen(false);
            setNombre("");
            setTelefono("");
            setBoletosStr("");
            loadData(); // refresh list
        }
    };

    const filteredParticipants = participants.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.includes(searchTerm) ||
        p.boletos.some(b => b.toString() === searchTerm)
    );

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando participantes...</div>;

    if (!activeRaffle) {
        return (
            <div className="glass-panel border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4">
                <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-2xl font-syne font-bold">No hay rifa activa</h3>
                <p className="text-muted-foreground">Debes crear una rifa para poder registrar participantes.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-syne font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        Participantes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona los boletos de la rifa: <span className="text-white/80 font-medium">{activeRaffle.nombre}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Registro
                </button>
            </div>

            {/* List & Filtering */}
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-white/30"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-bold text-white/80">{filteredParticipants.length}</span> participantes
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Participante</th>
                                <th className="px-6 py-4 font-medium">Boleto(s) Reservados</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredParticipants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No hay participantes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredParticipants.reverse().map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white/90">{p.nombre}</div>
                                            <div className="text-xs text-muted-foreground">{p.telefono || "Sin teléfono"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {p.boletos.map(b => (
                                                    <span key={b} className="px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20 text-xs font-bold font-syne">
                                                        #{b}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium uppercase tracking-wider">
                                                {p.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={handleOverlayClick}
                >
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-syne font-bold">Registrar Participante</h2>
                            <p className="text-sm text-muted-foreground">Separa los boletos para un comprador.</p>
                        </div>
                        <form onSubmit={handleRegister} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Nombre Completo</label>
                                    <input
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Teléfono / WhatsApp</label>
                                    <input
                                        required
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: +52 555 123 4567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Números Solicitados</label>
                                    <input
                                        required
                                        value={boletosStr}
                                        onChange={(e) => setBoletosStr(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary font-syne font-bold"
                                        placeholder="Ej: 5, 23, 42"
                                    />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Ticket className="w-3 h-3" />
                                        Separa los números por comas. El sistema validará su disponibilidad.
                                    </p>
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                                    {formError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Apartar Boletos
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
