"use client";

import { useState, useEffect } from "react";
import { Trophy, ArrowLeft, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { mockStore, type Raffle, type Participant } from "@/lib/store";

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

    useEffect(() => {
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
        const pointerAngle = 270; // Set to Top (270 degrees)
        const extraSpins = 360 * 5; // Spin smoothly for 5 full circles

        const currMod = ((rotation % 360) + 360) % 360;

        let targetRotation = pointerAngle - targetMidAngle;
        targetRotation = ((targetRotation % 360) + 360) % 360;

        let diff = targetRotation - currMod;
        if (diff < 0) diff += 360;

        const newRotation = rotation + extraSpins + diff;
        setRotation(newRotation);

        setTimeout(() => {
            const isWinningAttempt = currentIntento >= activeRaffle.giro_ganador || N === 1;

            if (isWinningAttempt) {
                setWinner({ boleto: selectedCard.boleto, nombre: selectedCard.nombre });
                setIsFinished(true);
                fireConfetti();
                mockStore.finalizeRaffle(selectedCard.boleto, selectedCard.nombre);
                setIsDrawing(false);
            } else {
                setSpunCard(selectedCard);
                // Pause slightly to show the eliminated card explicitly, then reset
                setTimeout(() => {
                    setEliminatedTickets(prev => [...prev, selectedCard.boleto]);
                    setCurrentIntento(prev => prev + 1);

                    setIsResetting(true);
                    setRotation(0);
                    setTimeout(() => {
                        setIsResetting(false);
                        setIsDrawing(false);
                        setSpunCard(null);
                    }, 50);
                }, 2000); // 2 seconds showing "Eliminated" overlay
            }
        }, 4000); // the wheel spins for 4 seconds
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
            <div className="glass-panel border-dashed border-2 px-6 py-16 rounded-3xl text-center space-y-4 max-w-2xl mx-auto">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-2xl font-syne font-bold">No hay rifa activa para sortear</h3>
                <Link href="/admin" className="text-primary hover:underline inline-block mt-4">Volver al Inicio</Link>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col pt-8 animate-in fade-in duration-500 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10 relative">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="z-10 relative">
                    <h1 className="text-2xl md:text-3xl font-syne font-bold flex items-center gap-2">
                        Ruleta del Sorteo
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">
                        {activeRaffle.nombre} • Ganador al {activeRaffle.giro_ganador}° intento
                    </p>
                </div>
            </div>

            {!canDraw ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="glass-panel text-center p-12 rounded-3xl space-y-4 max-w-md mx-auto">
                        <Trophy className="w-16 h-16 text-yellow-500/50 mx-auto" />
                        <h2 className="text-2xl font-bold font-syne">Sorteo no disponible</h2>
                        <p className="text-muted-foreground">Aún no hay ningún boleto vendido (0 reservaciones). Se requieren participantes para girar la ruleta.</p>
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
                                    <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
                                </div>
                            )}

                            {/* Wheel Container SVG */}
                            <div
                                className={`absolute inset-0 rounded-full shadow-2xl overflow-hidden transition-transform bg-zinc-950
                                    ${isResetting ? 'duration-0' : 'duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}
                                    ${winner ? 'border-4 sm:border-8 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-4 sm:border-8 border-white/20'}
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
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-zinc-900 border-2 sm:border-4 border-zinc-700/80 rounded-full z-20 shadow-lg" />
                            )}

                            {spunCard && !winner && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 rounded-full animate-in zoom-in duration-300">
                                    <div className="text-center px-4">
                                        <h3 className="text-red-500 font-bold text-4xl sm:text-5xl font-syne uppercase tracking-wider drop-shadow-md pb-2">¡Eliminado!</h3>
                                        <p className="text-white/80 text-sm sm:text-base font-bold uppercase tracking-widest text-glow font-syne mt-2">{currentIntento}° al agua</p>
                                        <p className="text-white text-3xl sm:text-4xl mt-2 font-bold tabular-nums">#{spunCard.boleto}</p>
                                        <p className="text-white/80 truncate w-full mt-1 text-sm sm:text-lg">{spunCard.nombre}</p>
                                    </div>
                                </div>
                            )}

                            {winner && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 rounded-full animate-in zoom-in duration-700">
                                    <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-2 sm:mb-4 animate-bounce" />
                                    <h3 className="text-yellow-500 font-bold text-4xl sm:text-5xl font-syne uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">¡GANADOR!</h3>
                                    <p className="text-white text-5xl sm:text-6xl font-bold mt-2 font-syne drop-shadow-md">#{winner.boleto}</p>
                                    <p className="text-white/90 text-lg sm:text-2xl mt-4 truncate px-8 w-full text-center" title={winner.nombre}>{winner.nombre}</p>
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
                                        relative group overflow-hidden px-6 py-4 sm:px-12 sm:py-5 rounded-full font-bold text-sm sm:text-lg font-syne transition-all z-40
                                        ${isDrawing || N === 0
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95'
                                            : 'bg-gradient-to-r from-primary to-green-400 text-zinc-950 hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]'
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
                                <div className="text-center space-y-4 relative z-40">
                                    <p className="text-emerald-400 font-bold text-lg border-b border-emerald-500/20 pb-2">Sorteo Finalizado Exitosamente</p>
                                    <Link href="/admin" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold transition-all inline-block hover:-translate-y-1 mt-2">
                                        Volver al Dashboard
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: History / Summary */}
                    <div className="w-full lg:max-w-sm glass-panel p-6 sm:p-8 rounded-3xl h-[400px] sm:h-[600px] flex flex-col border border-white/5 shadow-2xl relative z-20">
                        <h3 className="font-syne font-bold text-xl mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                            Registro
                            <span className="text-sm font-normal text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                {allTakenTickets.length} Vendidos
                            </span>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {/* Eliminados List */}
                            {eliminatedTickets.map((tc, idx) => (
                                <div key={`eliminated-${tc}-${idx}`} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl animate-in slide-in-from-right duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs">
                                            {idx + 1}°
                                        </div>
                                        <span className="text-white/60 line-through decoration-red-500/50">Boleto #{tc}</span>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-red-500/80 font-bold">Agua</span>
                                </div>
                            ))}

                            {/* Winner if exists */}
                            {winner && (
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl animate-in slide-in-from-bottom duration-500 ease-bounce mt-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                    <div className="flex items-center gap-3 w-3/4">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center font-bold text-xs shrink-0">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-yellow-500 font-bold block leading-none">Boleto #{winner.boleto}</span>
                                            <span className="text-yellow-500/60 text-xs block truncate mt-1" title={winner.nombre}>{winner.nombre}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded ml-2">Gana</span>
                                </div>
                            )}

                            {eliminatedTickets.length === 0 && !winner && (
                                <div className="text-center py-12 text-muted-foreground italic text-sm">
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
