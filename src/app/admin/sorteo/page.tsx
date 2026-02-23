"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, ArrowLeft, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { mockStore, type Raffle, type Participant } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function SorteoPage() {
    const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    // Draw state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentIntento, setCurrentIntento] = useState(1);
    const [eliminatedTickets, setEliminatedTickets] = useState<number[]>([]);
    const [winner, setWinner] = useState<{ boleto: number, nombre: string } | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    // Roulette state
    const [rotation, setRotation] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [spunCard, setSpunCard] = useState<{ boleto: number, nombre: string } | null>(null);

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
                setParticipants(await mockStore.getParticipants());
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

    const fireConfetti = () => {
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
    };

    type SliceDetails = { boleto: number; nombre: string };

    const getSliceDetails = (): SliceDetails[] => {
        const details: SliceDetails[] = [];
        participants.forEach(p => {
            p.boletos.forEach(b => {
                if (!eliminatedTickets.includes(b)) {
                    details.push({ boleto: b, nombre: p.nombre });
                }
            });
        });
        return details.sort((a, b) => a.boleto - b.boleto);
    };

    const sliceDetails = getSliceDetails();
    const N = sliceDetails.length;

    const allTakenTickets = participants.flatMap(p => p.boletos);
    const canDraw = allTakenTickets.length > 0;

    const handleDrawClick = () => {
        if (!activeRaffle || isDrawing || isFinished || N === 0) return;

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
                    setEliminatedTickets(prev => [...prev, selectedCard.boleto]);
                    setCurrentIntento(prev => prev + 1);

                    setIsResetting(true);
                    setRotation(0);
                    setTimeout(() => {
                        setIsResetting(false);
                        setIsDrawing(false);
                        setSpunCard(null);

                        // 📡 BROADCAST: Reset de ruleta para siguiente giro
                        broadcast('reset', {});
                    }, 50);
                }, 2000);
            }
        }, 4000);
    };

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent) * 50;
        const y = Math.sin(2 * Math.PI * percent) * 50;
        return [x + 50, y + 50];
    };

    const colors = ['#10b981', '#059669', '#047857', '#065f46', '#0f766e', '#0e7490'];

    const getFontSize = () => {
        if (N < 10) return 4;
        if (N < 20) return 3;
        if (N < 40) return 2;
        return 1.5;
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando Sorteo...</div>;

    if (!activeRaffle) {
        return (
            <div className="bg-brand-surface border-brand-border border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-sm">
                <Trophy className="w-12 h-12 text-brand-muted mx-auto" />
                <h3 className="text-2xl font-serif font-bold text-brand-text">No hay rifa activa para sortear</h3>
                <Link href="/admin" className="text-brand-accent hover:underline inline-block mt-4 font-medium">Volver al Inicio</Link>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col pt-8 animate-in fade-in duration-500 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 text-brand-muted hover:text-brand-accent hover:bg-brand-accent/5 rounded-full transition-colors z-10 relative">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="z-10 relative">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-brand-text flex items-center gap-2">
                        Ruleta del Sorteo
                    </h1>
                    <p className="text-brand-muted text-sm uppercase tracking-wider font-medium mt-1">
                        {activeRaffle.nombre} • Ganador al {activeRaffle.giro_ganador}° intento
                    </p>
                </div>
            </div>

            {!canDraw ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-brand-surface border border-brand-border shadow-sm text-center p-12 rounded-3xl space-y-4 max-w-md mx-auto">
                        <Trophy className="w-16 h-16 text-brand-accent/50 mx-auto" />
                        <h2 className="text-2xl font-bold font-serif text-brand-text">Sorteo no disponible</h2>
                        <p className="text-brand-muted">Aún no hay ningún boleto vendido (0 reservaciones). Se requieren participantes para girar la ruleta.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center relative w-full max-w-6xl mx-auto z-10 pb-8">

                    {/* Left: Roulette Machine */}
                    <div className="flex-1 w-full max-w-xl flex flex-col items-center justify-center">
                        <div className="relative group perspective-1000 w-[95%] sm:w-full max-w-[320px] sm:max-w-md aspect-square mx-auto mt-4 sm:my-8 text-black">

                            {/* Glow behind */}
                            <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 
                                ${isDrawing ? 'bg-primary/50 scale-110' :
                                    winner ? 'bg-yellow-500/50 scale-125' : 'bg-primary/20 scale-100'}`}
                            />

                            {/* Arrow Pointer */}
                            {!winner && (
                                <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 z-40">
                                    <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-brand-accent drop-shadow-md" />
                                </div>
                            )}

                            {/* Wheel Container SVG */}
                            <div
                                className={`absolute inset-0 rounded-full shadow-2xl overflow-hidden transition-transform bg-zinc-900
                                    ${isResetting ? 'duration-0' : 'duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}
                                    ${winner ? 'border-4 sm:border-8 border-brand-accent shadow-[0_0_50px_rgba(200,169,110,0.3)]' : 'border-4 sm:border-8 border-brand-border'}
                                `}
                                style={{ transform: `rotate(${rotation}deg)` }}
                            >
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {N === 1 ? (
                                        <>
                                            <circle cx="50" cy="50" r="50" fill={colors[0]} />
                                            <text x="50" y="50" fill="white" fontSize="4" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                                                #{sliceDetails[0].boleto} {sliceDetails[0].nombre}
                                            </text>
                                        </>
                                    ) : (
                                        sliceDetails.map((slice, i) => {
                                            const startPercent = i / N;
                                            const endPercent = (i + 1) / N;
                                            const [startX, startY] = getCoordinatesForPercent(startPercent);
                                            const [endX, endY] = getCoordinatesForPercent(endPercent);
                                            const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                                            const pathData = `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                                            const midPercent = (startPercent + endPercent) / 2;
                                            const angleDeg = midPercent * 360;

                                            return (
                                                <g key={`slice-${slice.boleto}-${i}`}>
                                                    <path d={pathData} fill={colors[i % colors.length]} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                                                    <text
                                                        x="50"
                                                        y="50"
                                                        fill="white"
                                                        fontSize={getFontSize()}
                                                        fontWeight="bold"
                                                        textAnchor="end"
                                                        dominantBaseline="middle"
                                                        transform={`rotate(${angleDeg}, 50, 50) translate(46, 0)`}
                                                    >
                                                        #{slice.boleto} {slice.nombre.length > 12 ? slice.nombre.substring(0, 11) + '..' : slice.nombre}
                                                    </text>
                                                </g>
                                            );
                                        })
                                    )}
                                </svg>
                            </div>

                            {/* Center Pin / Results Overlays */}
                            {(!spunCard && !winner) && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-brand-surface border-2 sm:border-4 border-brand-border rounded-full z-20 shadow-lg" />
                            )}

                            {spunCard && !winner && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full animate-in zoom-in duration-300">
                                    <div className="text-center px-4">
                                        <h3 className="text-red-500 font-bold text-4xl sm:text-5xl font-serif uppercase tracking-wider drop-shadow-sm pb-2">¡Eliminado!</h3>
                                        <p className="text-brand-muted text-sm sm:text-base font-bold uppercase tracking-widest mt-2">{currentIntento}° al agua</p>
                                        <p className="text-brand-text text-3xl sm:text-4xl mt-2 font-bold tabular-nums">#{spunCard.boleto}</p>
                                        <p className="text-brand-muted truncate w-full mt-1 text-sm sm:text-lg font-medium">{spunCard.nombre}</p>
                                    </div>
                                </div>
                            )}

                            {winner && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-brand-surface/95 backdrop-blur-md rounded-full animate-in zoom-in duration-700 shadow-2xl">
                                    <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-brand-accent mb-2 sm:mb-4 animate-bounce" />
                                    <h3 className="text-brand-accent font-bold text-4xl sm:text-5xl font-serif uppercase drop-shadow-[0_0_15px_rgba(200,169,110,0.5)]">¡GANADOR!</h3>
                                    <p className="text-brand-text text-5xl sm:text-6xl font-bold mt-2 font-serif drop-shadow-sm">#{winner.boleto}</p>
                                    <p className="text-brand-muted text-lg sm:text-2xl mt-4 truncate px-8 w-full text-center" title={winner.nombre}>{winner.nombre}</p>
                                </div>
                            )}

                        </div>

                        {/* Action Buttons */}
                        <div className="w-full flex justify-center mt-6 sm:mt-12">
                            {!winner ? (
                                <button
                                    onClick={handleDrawClick}
                                    disabled={isDrawing || N === 0}
                                    className={`
                                        relative group overflow-hidden px-8 py-4 sm:px-12 sm:py-5 rounded-full font-bold text-sm sm:text-lg transition-all z-40 shadow-lg
                                        ${isDrawing || N === 0
                                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed scale-95'
                                            : 'bg-brand-accent text-white hover:scale-105 hover:bg-brand-accent/90 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isDrawing ? (
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                            Girando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            {currentIntento === activeRaffle.giro_ganador ? "¡GIRAR POR EL PREMIO!" : `Generar ${currentIntento}° al agua`}
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <div className="text-center space-y-4 relative z-40 w-full max-w-sm mx-auto">
                                    <p className="text-brand-accent font-bold text-lg border-b border-brand-border pb-2">Sorteo Finalizado Exitosamente</p>
                                    <Link href="/admin" className="px-8 py-4 bg-white hover:bg-zinc-50 border border-brand-border rounded-full font-bold transition-all inline-block hover:-translate-y-1 mt-4 text-brand-text shadow-sm w-full">
                                        Volver al Dashboard
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: History / Summary */}
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
                            {eliminatedTickets.map((tc, idx) => (
                                <div key={`eliminated-${tc}-${idx}`} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-right duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            {idx + 1}°
                                        </div>
                                        <span className="text-brand-text/60 line-through decoration-red-400 font-medium">Boleto #{tc}</span>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-red-600/80 font-bold bg-white px-2 py-1 rounded-md border border-red-100">Agua</span>
                                </div>
                            ))}

                            {/* Winner if exists */}
                            {winner && (
                                <div className="flex items-center justify-between p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-xl animate-in slide-in-from-bottom duration-500 ease-bounce mt-4 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent pointer-events-none" />
                                    <div className="flex items-center gap-3 w-3/4 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold shrink-0 shadow-inner">
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-brand-text font-bold block leading-none text-lg">Boleto #{winner.boleto}</span>
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
                </div>
            )}
        </div>
    );
}
