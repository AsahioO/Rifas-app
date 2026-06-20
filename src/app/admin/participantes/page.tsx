"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Plus, Ticket, Search, Loader2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { mockStore, type Participant, type Raffle, validateParticipantName } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";

function ParticipantesContent() {
    const searchParams = useSearchParams();
    const raffleIdParam = searchParams.get("rifa");

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [boletosStr, setBoletosStr] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const loadData = useCallback(async () => {
        let raffle: Raffle | null = null;

        if (raffleIdParam) {
            raffle = await mockStore.getRaffleById(raffleIdParam);
        } else {
            raffle = await mockStore.getActiveRaffle();
        }

        setActiveRaffle(raffle);

        if (raffle) {
            setParticipants(await mockStore.getParticipants(raffle.id));
        }

        setLoading(false);
    }, [raffleIdParam]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    const openCreateModal = () => {
        setEditingParticipant(null);
        setNombre("");
        setTelefono("");
        setBoletosStr("");
        setFormError("");
        setIsFormOpen(true);
    };

    const openEditModal = (p: Participant) => {
        setEditingParticipant(p);
        setNombre(p.nombre);
        setTelefono(p.telefono);
        setBoletosStr(p.boletos.join(", "));
        setFormError("");
        setIsFormOpen(true);
    };

    const closeModal = () => {
        setIsFormOpen(false);
        setEditingParticipant(null);
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        const numeros = boletosStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

        if (numeros.length === 0) {
            setFormError("Ingresa al menos un número válido.");
            setFormLoading(false);
            return;
        }

        const nameError = validateParticipantName(nombre);
        if (nameError) {
            setFormError(nameError);
            setFormLoading(false);
            return;
        }

        await new Promise(r => setTimeout(r, 600));

        if (editingParticipant) {
            const { error } = await mockStore.updateParticipant(
                editingParticipant.id,
                nombre,
                telefono,
                numeros
            );
            setFormLoading(false);
            if (error) {
                setFormError(error.message);
            } else {
                showToast("Participante actualizado correctamente.", "success");
                closeModal();
                loadData();
            }
        } else {
            const { error } = await mockStore.registerParticipant(
                nombre,
                telefono,
                numeros,
                activeRaffle?.id
            );
            setFormLoading(false);
            if (error) {
                setFormError(error.message);
            } else {
                showToast("Participante registrado correctamente.", "success");
                closeModal();
                loadData();
            }
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
            <div className="bg-brand-surface border-brand-border border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4 shadow-sm">
                <Users className="w-12 h-12 text-brand-muted mx-auto" />
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                    {raffleIdParam ? "Rifa no encontrada" : "No hay rifa activa"}
                </h3>
                <p className="text-brand-muted">
                    {raffleIdParam
                        ? "La rifa solicitada no existe o fue eliminada."
                        : "Debes crear una rifa para poder registrar participantes."}
                </p>
            </div>
        );
    }

    const isFinalized = activeRaffle.estado === 'finalizada' || activeRaffle.estado === 'archivada';
    const isEditing = editingParticipant !== null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-text flex items-center gap-3">
                        <Users className="w-8 h-8 text-brand-accent" />
                        Participantes
                    </h1>
                    <p className="text-brand-muted mt-1 flex items-center gap-2 flex-wrap">
                        Gestiona los boletos de la rifa:
                        <span className="text-brand-text font-medium">{activeRaffle.nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${
                            activeRaffle.estado === 'activa'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : activeRaffle.estado === 'borrador'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                            {activeRaffle.estado}
                        </span>
                    </p>
                </div>
                {!isFinalized && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Registro
                    </motion.button>
                )}
            </div>

            {/* List & Filtering */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted/50" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent placeholder:text-brand-muted/50 text-brand-text"
                        />
                    </div>
                    <div className="text-sm text-brand-muted">
                        Mostrando <span className="font-bold text-brand-text">{filteredParticipants.length}</span> participantes
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-brand-bg text-brand-muted border-b border-brand-border">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Participante</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Boleto(s) Reservados</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Estado</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Fecha</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs w-20">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filteredParticipants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-brand-muted italic">
                                        No hay participantes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredParticipants.reverse().map((p, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                        key={p.id} className="hover:bg-brand-bg/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-brand-text">{p.nombre}</div>
                                            <div className="text-xs text-brand-muted mt-0.5">{p.telefono || "Sin teléfono"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {p.boletos.map(b => (
                                                    <span key={b} className="px-2 py-1 rounded-md bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-xs font-bold font-serif">
                                                        #{b}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-semibold uppercase tracking-wider">
                                                {p.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-brand-muted font-medium">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => openEditModal(p)}
                                                className="p-2 bg-brand-bg hover:bg-brand-accent/10 text-brand-muted hover:text-brand-accent rounded-lg transition-colors border border-brand-border"
                                                title="Editar participante"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro / Edición */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={handleOverlayClick}
                >
                    <div className="bg-brand-surface border border-brand-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-brand-border bg-brand-bg/50">
                            <h2 className="text-xl font-serif font-bold text-brand-text">
                                {isEditing ? "Editar Participante" : "Registrar Participante"}
                            </h2>
                            <p className="text-sm text-brand-muted mt-1">
                                {isEditing
                                    ? "Modifica los datos y boletos del participante."
                                    : "Separa los boletos para un comprador."}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-brand-text">Nombre Completo</label>
                                    <input
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full bg-white border border-brand-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-brand-text">Teléfono / WhatsApp</label>
                                    <input
                                        required
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="w-full bg-white border border-brand-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent text-brand-text"
                                        placeholder="Ej: +52 555 123 4567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-brand-text">Números Solicitados</label>
                                    <input
                                        required
                                        value={boletosStr}
                                        onChange={(e) => setBoletosStr(e.target.value)}
                                        className="w-full bg-white border border-brand-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent font-serif font-bold text-brand-text"
                                        placeholder="Ej: 5, 23, 42"
                                    />
                                    <p className="text-xs text-brand-muted flex items-center gap-1 mt-1">
                                        <Ticket className="w-3 h-3" />
                                        Separa los números por comas. El sistema validará su disponibilidad.
                                    </p>
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium">
                                    {formError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-brand-muted hover:bg-brand-bg hover:text-brand-text transition-colors"
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={formLoading}
                                    className="bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isEditing ? "Guardar Cambios" : "Apartar Boletos"}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ParticipantesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center animate-pulse">Cargando participantes...</div>}>
            <ParticipantesContent />
        </Suspense>
    );
}
