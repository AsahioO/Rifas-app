"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Trophy, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mockStore, type Raffle, type Participant, isValidParticipantName } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { RaffleWheel } from "@/components/RaffleWheel";

export default function SorteoPage() {
    const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    // Draw state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentIntento, setCurrentIntento] = useState(1);
    const [eliminatedTickets, setEliminatedTickets] = useState<{ boleto: number; nombre: string }[]>([]);
    const [winner, setWinner] = useState<{ boleto: number, nombre: string } | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    // Roulette state
    const [rotation, setRotation] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [spunCard, setSpunCard] = useState<{ boleto: number, nombre: string } | null>(null);

    // Live mode detection
    const searchParams = useSearchParams();
    const isLiveMode = searchParams.get("live") === "1";

    // Realtime Broadcast channel
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const broadcast = (evento: string, payload: Record<string, unknown>) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'sorteo',
            payload: { evento, ...payload },
        });
    };

    useEffect(() => {
        // Crear canal Broadcast
        const channel = supabase.channel('sorteo-live');
        channel.subscribe();
        channelRef.current = channel;

        const loadData = async () => {
            const raffle = await mockStore.getActiveRaffle();
            setActiveRaffle(raffle);
            if (raffle) {
                setParticipants(await mockStore.getParticipants(raffle.id));
                if (raffle.estado === 'finalizada' && raffle.ganador_boleto) {
                    setWinner({
                        boleto: raffle.ganador_boleto,
                        nombre: raffle.ganador_nombre || "Anónimo"
                    });
                    setIsFinished(true);
                }
            }
            setLoading(false);
        };
        loadData();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fireConfetti = useCallback(async () => {
        const confetti = (await import("canvas-confetti")).default;
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: Math.random() * 0.3, y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 }
            });
        }, 250);
    }, []);

    type SliceDetails = { boleto: number; nombre: string };

    const eliminatedBoletos = useMemo(() => new Set(eliminatedTickets.map(e => e.boleto)), [eliminatedTickets]);

    const sliceDetails = useMemo<SliceDetails[]>(() => {
        const details: SliceDetails[] = [];
        participants.forEach(p => {
            p.boletos.forEach(b => {
                if (!eliminatedBoletos.has(b)) {
                    details.push({ boleto: b, nombre: p.nombre });
                }
            });
        });
        return details.sort((a, b) => a.boleto - b.boleto);
    }, [participants, eliminatedBoletos]);

    const N = sliceDetails.length;

    const allTakenTickets = participants.flatMap(p => p.boletos);

    const invalidParticipants = useMemo(
        () => participants.filter(p => !isValidParticipantName(p.nombre)),
        [participants]
    );
    const hasInvalidNames = invalidParticipants.length > 0;

    const handleDrawClick = () => {
        if (!activeRaffle || isDrawing || isFinished || N === 0 || hasInvalidNames) return;

        setIsDrawing(true);
        setSpunCard(null);

        // Select target randomly from visual wheel
        const targetIndex = Math.floor(Math.random() * N);
        const selectedCard = sliceDetails[targetIndex];

        // Calculate dynamic rotation
        const sliceAngle = 360 / N;
        const targetMidAngle = targetIndex * sliceAngle + (sliceAngle / 2);
        const pointerAngle = 270;
        const extraSpins = 360 * 5;

        const currMod = ((rotation % 360) + 360) % 360;

        let targetRotation = pointerAngle - targetMidAngle;
        targetRotation = ((targetRotation % 360) + 360) % 360;

        let diff = targetRotation - currMod;
        if (diff < 0) diff += 360;

        const newRotation = rotation + extraSpins + diff;
        setRotation(newRotation);

        // 📡 BROADCAST: Enviar evento de giro a la Landing
        broadcast('girando', {
            rotation: newRotation,
            slices: sliceDetails.map(s => ({ boleto: s.boleto, nombre: s.nombre })),
            intento: currentIntento,
            totalIntentos: activeRaffle.giro_ganador,
            premioConsolacion: activeRaffle.premio_consolacion?.trim() || null,
        });

        setTimeout(() => {
            const isWinningAttempt = currentIntento >= activeRaffle.giro_ganador || N === 1;

            if (isWinningAttempt) {
                setWinner({ boleto: selectedCard.boleto, nombre: selectedCard.nombre });
                setIsFinished(true);
                fireConfetti();
                mockStore.finalizeRaffle(selectedCard.boleto, selectedCard.nombre);
                setIsDrawing(false);

                // 📡 BROADCAST: Ganador
                broadcast('ganador', {
                    boleto: selectedCard.boleto,
                    nombre: selectedCard.nombre,
                });
            } else {
                setSpunCard(selectedCard);

                // 📡 BROADCAST: Eliminado
                broadcast('eliminado', {
                    boleto: selectedCard.boleto,
                    nombre: selectedCard.nombre,
                    intento: currentIntento,
                });

                setTimeout(() => {
                    setEliminatedTickets(prev => [...prev, { boleto: selectedCard.boleto, nombre: selectedCard.nombre }]);
                    setCurrentIntento(prev => prev + 1);

                    setIsResetting(true);
                    setRotation(0);
                        setTimeout(() => {
                            setIsResetting(false);
                            setIsDrawing(false);

                            // 📡 BROADCAST: Reset de ruleta para siguiente giro
                            broadcast('reset', {});
                    }, 50);
                }, 2000);
            }
        }, 5000);
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando Sorteo…</div>;

    if (!activeRaffle) {
        return (
            <div className="bg-brand-surface border-brand-border border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-sm">
                <Trophy className="w-12 h-12 text-brand-muted mx-auto" />
                <h3 className="text-2xl font-serif font-bold text-brand-text">No hay rifa activa para sortear</h3>
                {!isLiveMode && (
                <Link href="/admin" className="text-brand-accent hover:underline inline-block mt-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">Volver al Inicio</Link>
                )}
            </div>
        );
    }

    return (
        <div className={`${isLiveMode ? 'min-h-screen items-center justify-center bg-[#15100b] p-4 text-[#fbf6ea] sm:p-8' : 'min-h-[80vh] pt-8'} flex flex-col animate-in fade-in duration-500 overflow-hidden`}>
            {/* Header */}
            <div className={`flex items-center gap-4 mb-8 ${isLiveMode ? 'justify-center' : ''}`}>
                {!isLiveMode && (
                    <Link href="/admin" aria-label="Volver al dashboard" className="p-2 text-brand-muted hover:text-brand-accent hover:bg-brand-accent/5 rounded-full transition-colors z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                )}
                <div className="z-10 relative">
                    <h1 className={`text-2xl md:text-3xl font-serif font-bold flex items-center gap-2 ${isLiveMode ? 'text-[#fbf6ea]' : 'text-brand-text'}`}>
                        {isLiveMode ? "Transmisión del Sorteo" : "Ruleta del Sorteo"}
                    </h1>
                    <p className={`text-sm uppercase tracking-wider font-medium mt-1 ${isLiveMode ? 'text-[#cdbf9f]' : 'text-brand-muted'}`}>
                        {activeRaffle.nombre} • Ganador al {activeRaffle.giro_ganador}° intento
                    </p>
                </div>
            </div>

            {allTakenTickets.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-brand-surface border border-brand-border shadow-sm text-center p-12 rounded-3xl space-y-4 max-w-md mx-auto">
                        <Trophy className="w-16 h-16 text-brand-accent/50 mx-auto" />
                        <h2 className="text-2xl font-bold font-serif text-brand-text">Sorteo no disponible</h2>
                        <p className="text-brand-muted">Aún no hay ningún boleto vendido (0 reservaciones). Se requieren participantes para girar la ruleta.</p>
                    </div>
                </div>
            ) : hasInvalidNames ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-50 border border-red-200 shadow-sm text-center p-10 rounded-3xl space-y-5 max-w-lg mx-auto">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold font-serif text-red-700">Nombres de participantes inválidos</h2>
                        <p className="text-red-600 text-sm leading-relaxed">
                            Los siguientes participantes tienen nombres que no son válidos (solo números, muy cortos o vacíos). Edítalos antes de iniciar el sorteo.
                        </p>
                        <div className="bg-white border border-red-100 rounded-xl p-4 text-left space-y-2 max-h-48 overflow-y-auto">
                            {invalidParticipants.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-sm">
                                    <span className="text-red-700 font-medium truncate">
                                        &ldquo;{p.nombre || "(vacío)"}&rdquo;
                                    </span>
                                    <span className="text-red-400 text-xs shrink-0 ml-2">
                                        Boletos: {p.boletos.join(", ")}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {!isLiveMode && (
                            <Link
                                href={`/admin/participantes${activeRaffle ? `?rifa=${activeRaffle.id}` : ""}`}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
                            >
                                Ir a editar participantes
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <div className={`flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center relative w-full mx-auto z-10 pb-8 ${isLiveMode ? 'max-w-7xl' : 'max-w-6xl'}`}>

                    {/* Left: Roulette Machine */}
                    <div className={`flex-1 w-full ${isLiveMode ? 'max-w-3xl' : 'max-w-xl'} flex flex-col items-center justify-center`}>
                        <RaffleWheel
                            slices={sliceDetails}
                            rotation={rotation}
                            isResetting={isResetting}
                            result={spunCard}
                            winner={winner}
                            currentAttempt={currentIntento}
                            totalAttempts={activeRaffle.giro_ganador}
                            isDrawing={isDrawing}
                            showNames={true}
                            centerLabel={isLiveMode ? "LIVE" : "RIFA"}
                            consolationPrize={activeRaffle?.premio_consolacion}
                            className={`w-[92%] sm:w-full ${isLiveMode ? 'max-w-[420px] sm:max-w-[620px]' : 'max-w-[340px] sm:max-w-md'} mx-auto mt-4 sm:my-8`}
                        />

                        {/* Action Buttons */}
                        <div className="w-full flex justify-center mt-6 sm:mt-12">
                            {!winner ? (
                                <button
                                    onClick={handleDrawClick}
                                    disabled={isDrawing || N === 0}
                                    className={`
                                        relative group overflow-hidden px-8 py-4 sm:px-12 sm:py-5 rounded-full font-bold text-sm sm:text-lg transition-[background-color,border-color,color,box-shadow,transform] z-40 shadow-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2
                                        ${isDrawing || N === 0
                                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed scale-95'
                                            : isLiveMode
                                                ? 'bg-[#c5a15f] text-[#21170f] border-[#f1e2bf] hover:bg-[#f1e2bf] hover:scale-105 hover:shadow-xl'
                                                : 'bg-brand-accent text-white border-brand-accent hover:scale-105 hover:bg-brand-accent/90 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isDrawing ? (
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                            Girando…
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            {currentIntento === activeRaffle.giro_ganador ? "¡GIRAR POR EL PREMIO!" : `Girar intento ${currentIntento}`}
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <div className="text-center space-y-4 relative z-40 w-full max-w-sm mx-auto">
                                    <p className={`font-bold text-lg border-b pb-2 ${isLiveMode ? 'text-[#f1e2bf] border-[#3b3024]' : 'text-brand-accent border-brand-border'}`}>Sorteo finalizado exitosamente</p>
                                    {!isLiveMode && (
                                    <Link href="/admin" className="px-8 py-4 bg-white hover:bg-zinc-50 border border-brand-border rounded-full font-bold transition-[background-color,border-color,box-shadow,transform] inline-block hover:-translate-y-1 mt-4 text-brand-text shadow-sm w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">
                                        Volver al Dashboard
                                    </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: History / Summary */}
                    {isLiveMode ? (
                    <div className="w-full lg:max-w-sm rounded-[2rem] border border-[#3b3024] bg-[#21170f] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.25)] sm:p-8">
                        <div className="mb-6 flex items-center justify-between border-b border-[#3b3024] pb-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#c5a15f]">En vivo</p>
                                <h3 className="mt-2 font-serif text-2xl font-bold text-[#fbf6ea]">Panel del sorteo</h3>
                            </div>
                            <span className="h-3 w-3 rounded-full bg-[#c84b4b] shadow-[0_0_0_5px_rgba(200,75,75,0.16)]" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="rounded-2xl border border-[#3b3024] bg-[#15100b] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#cdbf9f]">Intento</p>
                                <p className="mt-2 text-2xl font-black tabular-nums text-[#f1e2bf]">{Math.min(currentIntento, activeRaffle.giro_ganador)}/{activeRaffle.giro_ganador}</p>
                            </div>
                            <div className="rounded-2xl border border-[#3b3024] bg-[#15100b] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#cdbf9f]">En juego</p>
                                <p className="mt-2 text-2xl font-black tabular-nums text-[#f1e2bf]">{N}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#3b3024] bg-[#15100b] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#cdbf9f]">Estado</p>
                            <p className="mt-2 text-lg font-bold text-[#fbf6ea]">
                                {winner ? "Ganador confirmado" : isDrawing ? "Ruleta girando" : "Lista para el siguiente intento"}
                            </p>
                        </div>

                        <div className="mt-6 max-h-[260px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {eliminatedTickets.map((entry, idx) => (
                                <div key={`live-eliminated-${entry.boleto}-${idx}`} className="flex items-center justify-between rounded-xl border border-[#3b3024] bg-[#1a130e] p-3">
                                    <div className="min-w-0">
                                        <span className="font-bold text-[#cdbf9f] block">Boleto {entry.boleto}</span>
                                        <span className="text-xs text-[#a9977b] truncate block" title={entry.nombre}>{entry.nombre}</span>
                                    </div>
                                    <span className="rounded-full border border-[#8a2f2f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#e9b0a8] shrink-0 ml-2">Eliminado</span>
                                </div>
                            ))}

                            {eliminatedTickets.length === 0 && !winner && (
                                <div className="rounded-xl border border-dashed border-[#3b3024] p-6 text-center text-sm font-medium text-[#cdbf9f]">
                                    Los boletos eliminados aparecerán aquí.
                                </div>
                            )}
                        </div>
                    </div>
                    ) : (
                    <div className="w-full lg:max-w-sm bg-brand-surface p-6 sm:p-8 rounded-3xl h-[400px] sm:h-[600px] flex flex-col border border-brand-border shadow-md relative z-20">
                        <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-6">
                            <h3 className="font-serif font-bold text-xl text-brand-text">
                                Registro
                            </h3>
                            <span className="text-sm font-medium text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">
                                {allTakenTickets.length} Vendidos
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {/* Eliminados List */}
                            {eliminatedTickets.map((entry, idx) => (
                                <div key={`eliminated-${entry.boleto}-${idx}`} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-right duration-300">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            {idx + 1}°
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-brand-text/60 line-through decoration-red-400 font-medium block">Boleto {entry.boleto}</span>
                                            <span className="text-xs text-brand-muted truncate block" title={entry.nombre}>{entry.nombre}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-red-600/80 font-bold bg-white px-2 py-1 rounded-md border border-red-100 shrink-0 ml-2">Eliminado</span>
                                </div>
                            ))}

                            {/* Winner if exists */}
                            {winner && (
                                <div className="flex items-center justify-between p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-xl animate-in slide-in-from-bottom duration-500 ease-bounce mt-4 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-3 w-3/4 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold shrink-0 shadow-inner">
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-brand-text font-bold block leading-none text-lg">Boleto {winner.boleto}</span>
                                            <span className="text-brand-muted text-sm block truncate mt-1 font-medium" title={winner.nombre}>{winner.nombre}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-accent bg-white border border-brand-accent/20 px-3 py-1.5 rounded-full ml-2 relative z-10 shadow-sm">Gana</span>
                                </div>
                            )}

                            {eliminatedTickets.length === 0 && !winner && (
                                <div className="text-center py-12 text-brand-muted font-medium text-sm border-2 border-dashed border-brand-border rounded-xl">
                                    El sorteo aún no comienza.<br />Los boletos eliminados aparecerán aquí.
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            )}
        </div>
    );
}
