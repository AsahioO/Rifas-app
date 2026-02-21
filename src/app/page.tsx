"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Ticket as TicketIcon, Clock, Trophy, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { mockStore, type Raffle, type Participant } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [takenTickets, setTakenTickets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFinished, setLastFinished] = useState<Raffle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const confettiFired = useRef(false);

  // ===== REALTIME ROULETTE STATE =====
  type LiveSlice = { boleto: number; nombre: string };
  const [liveActive, setLiveActive] = useState(false);
  const [liveRotation, setLiveRotation] = useState(0);
  const [liveSlices, setLiveSlices] = useState<LiveSlice[]>([]);
  const [liveEliminated, setLiveEliminated] = useState<{ boleto: number; nombre: string; intento: number }[]>([]);
  const [liveWinner, setLiveWinner] = useState<{ boleto: number; nombre: string } | null>(null);
  const [liveIsResetting, setLiveIsResetting] = useState(false);
  const [liveSpunCard, setLiveSpunCard] = useState<{ boleto: number; nombre: string } | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // Auto-slide carousel
  useEffect(() => {
    if (!activeRaffle || !activeRaffle.fotos || activeRaffle.fotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % activeRaffle.fotos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeRaffle]);

  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % activeRaffle!.fotos.length);
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + activeRaffle!.fotos.length) % activeRaffle!.fotos.length);

  const fireConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#eab308', '#22c55e'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#eab308', '#22c55e'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await mockStore.getActiveRaffle();
      setActiveRaffle(data);
      if (data) {
        setTakenTickets(await mockStore.getTakenTickets());
        setParticipants(await mockStore.getParticipants());
        if (data.estado === 'finalizada' && !confettiFired.current) {
          fireConfetti();
          confettiFired.current = true;
        }
      } else {
        // Si no hay activa, buscar la última finalizada para mostrar ganador persistente
        const finished = await mockStore.getLastFinishedRaffle();
        setLastFinished(finished);
      }
      setLoading(false);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    // ===== SUPABASE REALTIME LISTENER =====
    const channel = supabase.channel('sorteo-live');
    channel.on('broadcast', { event: 'sorteo' }, ({ payload }) => {
      const evento = payload.evento as string;

      if (evento === 'girando') {
        setLiveActive(true);
        setLiveWinner(null);
        setLiveSpunCard(null);
        setLiveIsResetting(false);
        setLiveSlices(payload.slices as LiveSlice[]);
        setLiveRotation(payload.rotation as number);
        setTimeout(() => liveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }

      if (evento === 'eliminado') {
        setLiveSpunCard({ boleto: payload.boleto as number, nombre: payload.nombre as string });
        setTimeout(() => {
          setLiveEliminated(prev => [...prev, { boleto: payload.boleto as number, nombre: payload.nombre as string, intento: payload.intento as number }]);
        }, 1500);
      }

      if (evento === 'reset') {
        setLiveIsResetting(true);
        setLiveRotation(0);
        setLiveSpunCard(null);
        setTimeout(() => setLiveIsResetting(false), 50);
      }

      if (evento === 'ganador') {
        setLiveWinner({ boleto: payload.boleto as number, nombre: payload.nombre as string });
        setLiveSpunCard(null);
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const confettiInterval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(confettiInterval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3, y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 } });
        }, 250);
      }
    }).subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fireConfetti]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER */}
      <header className="px-6 py-6 flex justify-between items-center glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="font-syne font-bold text-2xl tracking-tighter">
            WHATSHOME<span className="text-primary">RIFAS</span>
          </h1>
        </div>
        <a
          href="/admin/login"
          className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
        >
          Iniciar Sesión
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {loading ? (
          <div className="py-32 w-full text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground animate-pulse">Cargando Rifa Activa...</p>
          </div>
        ) : !activeRaffle ? (
          <div className="w-full flex-1 flex flex-col justify-center items-center py-16 px-6">
            {lastFinished && lastFinished.ganador_nombre && lastFinished.ganador_nombre !== 'Cancelada' ? (
              /* ===== PERSISTENT WINNER VIEW ===== */
              <div className="w-full max-w-3xl space-y-8 text-center animate-in fade-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />
                  <div className="glass-panel p-10 sm:p-14 rounded-[2rem] border border-yellow-500/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

                    <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-6 animate-bounce" />
                    <h2 className="text-4xl sm:text-5xl font-syne font-bold text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.3)] mb-4">
                      ¡Tenemos Ganador!
                    </h2>
                    <p className="text-muted-foreground mb-8 text-lg">La rifa <strong className="text-white">{lastFinished.nombre}</strong> ha concluido</p>

                    <div className="glass-panel p-8 rounded-2xl border border-yellow-500/10 inline-block mx-auto">
                      <p className="text-yellow-500 text-7xl sm:text-8xl font-bold font-syne mb-3">#{lastFinished.ganador_boleto}</p>
                      <p className="text-white text-2xl sm:text-3xl font-bold">{lastFinished.ganador_nombre}</p>
                      <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Boleto Ganador</p>
                    </div>

                    {lastFinished.fotos && lastFinished.fotos.length > 0 && (
                      <div className="mt-10 max-w-sm mx-auto">
                        <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                          <img src={lastFinished.fotos[0]} alt="Premio" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-muted-foreground text-sm mt-3">{lastFinished.descripcion}</p>
                      </div>
                    )}

                    <p className="text-white/30 text-xs mt-10 uppercase tracking-widest">¡Felicidades! Pronto habrá una nueva rifa...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg glass-panel p-12 rounded-[2rem] text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                  <Trophy className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold font-syne">No hay rifas activas</h2>
                <p className="text-muted-foreground">La administración aún no ha publicado el próximo gran premio. Por favor vuelve más tarde para asegurar tu boleto.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* HERO SECTION */}
            <section className="w-full max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-center md:text-left z-10">
                {activeRaffle.estado === 'activa' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-primary/30 text-primary text-sm font-medium animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Rifa Activa
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-yellow-500/30 text-yellow-500 text-sm font-medium animate-bounce shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <PartyPopper className="w-4 h-4" />
                    ¡Rifa Finalizada Exitosamente!
                  </div>
                )}

                <h2 className="font-syne text-5xl md:text-7xl font-extrabold tracking-tight text-glow">
                  {activeRaffle.nombre}
                </h2>

                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0 text-balance whitespace-pre-wrap">
                  {activeRaffle.descripcion}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                  <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center border-white/5 border-primary/20 bg-primary/5">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Estado Actual</span>
                    <span className={`text-xl font-bold flex items-center gap-2 ${activeRaffle.estado === 'activa' ? 'text-primary' : 'text-yellow-500'}`}>
                      {activeRaffle.estado === 'activa' ? <Clock className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                      {activeRaffle.estado === 'activa' ? "En Venta" : "Rifa Concluida"}
                    </span>
                  </div>
                </div>

                {activeRaffle.estado === 'finalizada' && activeRaffle.ganador_boleto ? (
                  <div className="pt-8 w-full md:w-auto">
                    <div className="w-full sm:w-auto inline-flex items-center justify-center gap-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/50 px-8 py-6 rounded-3xl sm:rounded-full font-bold transition-all shadow-[0_10px_30px_rgba(234,179,8,0.15)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-yellow-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out skew-x-12" />
                      <div className="w-16 h-16 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center text-3xl font-syne z-10">
                        #{activeRaffle.ganador_boleto}
                      </div>
                      <div className="text-left z-10">
                        <div className="text-sm font-medium text-yellow-500/80 uppercase tracking-widest font-syne">Gran Ganador</div>
                        <div className="text-2xl text-yellow-500 h-[28px]">{activeRaffle.ganador_nombre}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-8 w-full md:w-auto">
                    <a href="#boletos" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl sm:rounded-full font-bold text-lg transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                      <TicketIcon className="w-6 h-6" />
                      Ver {activeRaffle.total_boletos} Boletos
                    </a>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full max-w-[320px] sm:max-w-md relative group mt-8 md:mt-0 mx-auto">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                <div className="relative aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden glass-panel border border-white/10 p-2 sm:p-5">
                  <div className="w-full h-full bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    {activeRaffle.fotos && activeRaffle.fotos.length > 0 ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeRaffle.fotos[currentImageIndex]}
                          alt={`${activeRaffle.nombre} - vista ${currentImageIndex + 1}`}
                          className="object-cover w-full h-full transition-all duration-500 ease-in-out hover:scale-105"
                        />

                        {/* Controls (only if multiple images) */}
                        {activeRaffle.fotos.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                              aria-label="Anterior imagen"
                            >
                              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/80 backdrop-blur transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                              aria-label="Siguiente imagen"
                            >
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm">
                              {activeRaffle.fotos.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  onClick={() => setCurrentImageIndex(dotIdx)}
                                  className={`h-2 rounded-full transition-all duration-300 ${dotIdx === currentImageIndex ? 'bg-primary w-6' : 'bg-white/40 hover:bg-white/80 w-2'}`}
                                  aria-label={`Ir a imagen ${dotIdx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm font-medium">Sin imagen</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ===== LIVE ROULETTE SECTION ===== */}
            {liveActive && (
              <section ref={liveRef} className="w-full max-w-5xl mx-auto px-6 py-16 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                <div className="text-center space-y-2 mb-10">
                  <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    En Vivo
                  </div>
                  <h3 className="font-syne text-3xl sm:text-4xl font-bold text-white">¡El Sorteo está ocurriendo ahora!</h3>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                  {/* Live Wheel */}
                  <div className="relative w-[280px] sm:w-[350px] aspect-square mx-auto">
                    <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${liveWinner ? 'bg-yellow-500/50 scale-125' : 'bg-primary/30 scale-100'}`} />

                    {/* Pointer */}
                    {!liveWinner && (
                      <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 z-40">
                        <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
                      </div>
                    )}

                    {/* Wheel */}
                    <div
                      className={`absolute inset-0 rounded-full shadow-2xl overflow-hidden bg-zinc-950
                        ${liveIsResetting ? 'duration-0' : 'transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}
                        ${liveWinner ? 'border-4 sm:border-8 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-4 sm:border-8 border-white/20'}
                      `}
                      style={{ transform: `rotate(${liveRotation}deg)` }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {liveSlices.length === 1 ? (
                          <>
                            <circle cx="50" cy="50" r="50" fill="#10b981" />
                            <text x="50" y="50" fill="white" fontSize="4" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                              #{liveSlices[0].boleto} {liveSlices[0].nombre}
                            </text>
                          </>
                        ) : (
                          liveSlices.map((slice, i) => {
                            const N = liveSlices.length;
                            const startPercent = i / N;
                            const endPercent = (i + 1) / N;
                            const startX = Math.cos(2 * Math.PI * startPercent) * 50 + 50;
                            const startY = Math.sin(2 * Math.PI * startPercent) * 50 + 50;
                            const endX = Math.cos(2 * Math.PI * endPercent) * 50 + 50;
                            const endY = Math.sin(2 * Math.PI * endPercent) * 50 + 50;
                            const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                            const pathData = `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                            const midPercent = (startPercent + endPercent) / 2;
                            const angleDeg = midPercent * 360;
                            const colors = ['#10b981', '#059669', '#047857', '#065f46', '#0f766e', '#0e7490'];
                            const fontSize = N < 10 ? 4 : N < 20 ? 3 : N < 40 ? 2 : 1.5;

                            return (
                              <g key={`live-${slice.boleto}-${i}`}>
                                <path d={pathData} fill={colors[i % colors.length]} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                                <text x="50" y="50" fill="white" fontSize={fontSize} fontWeight="bold" textAnchor="end" dominantBaseline="middle"
                                  transform={`rotate(${angleDeg}, 50, 50) translate(46, 0)`}>
                                  #{slice.boleto}
                                </text>
                              </g>
                            );
                          })
                        )}
                      </svg>
                    </div>

                    {/* Center Pin */}
                    {!liveSpunCard && !liveWinner && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-zinc-900 border-2 sm:border-4 border-zinc-700/80 rounded-full z-20 shadow-lg" />
                    )}

                    {/* Eliminated Overlay */}
                    {liveSpunCard && !liveWinner && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 rounded-full animate-in zoom-in duration-300">
                        <div className="text-center px-4">
                          <h3 className="text-red-500 font-bold text-3xl sm:text-4xl font-syne uppercase drop-shadow-md">¡Eliminado!</h3>
                          <p className="text-white text-2xl sm:text-3xl mt-2 font-bold">#{liveSpunCard.boleto}</p>
                          <p className="text-white/80 truncate w-full mt-1 text-sm sm:text-lg">{liveSpunCard.nombre}</p>
                        </div>
                      </div>
                    )}

                    {/* Winner Overlay */}
                    {liveWinner && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 rounded-full animate-in zoom-in duration-700">
                        <PartyPopper className="w-10 h-10 sm:w-14 sm:h-14 text-yellow-500 mb-2 animate-bounce" />
                        <h3 className="text-yellow-500 font-bold text-3xl sm:text-4xl font-syne uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">¡GANADOR!</h3>
                        <p className="text-white text-4xl sm:text-5xl font-bold mt-2 font-syne">#{liveWinner.boleto}</p>
                        <p className="text-white/90 text-base sm:text-xl mt-2 truncate px-6 w-full text-center">{liveWinner.nombre}</p>
                      </div>
                    )}
                  </div>

                  {/* Eliminated List */}
                  {liveEliminated.length > 0 && (
                    <div className="w-full lg:max-w-xs glass-panel p-6 rounded-2xl border border-white/5 max-h-[350px] overflow-y-auto space-y-2">
                      <h4 className="font-syne font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Eliminados</h4>
                      {liveEliminated.map((el, idx) => (
                        <div key={`live-el-${el.boleto}-${idx}`} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs">{el.intento}°</span>
                            <span className="text-white/60 line-through">#{el.boleto}</span>
                          </div>
                          <span className="text-xs text-red-500/80 font-bold uppercase">Agua</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* BOLETOS GRID */}
            <section id="boletos" className="w-full max-w-5xl mx-auto px-6 py-20 border-t border-white/5 relative">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="text-center space-y-4 mb-16">
                <h3 className="font-syne text-4xl sm:text-5xl font-bold">Elige tu número de la suerte</h3>
                <p className="text-muted-foreground text-lg">Contacta por WhatsApp para asegurar tu reserva antes que nadie.</p>
                <div className="flex items-center justify-center gap-8 text-sm text-white/70 pt-4">
                  <div className="flex items-center gap-2 font-medium"><div className="w-4 h-4 rounded bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Disponible</div>
                  <div className="flex items-center gap-2 font-medium text-white/40"><div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700" /> Ocupado</div>
                </div>
              </div>

              {/* New Vertical List Layout */}
              <div className="max-w-3xl mx-auto w-full glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[600px]">
                {/* Panel Header */}
                <div className="bg-black/40 backdrop-blur-xl border-b border-white/5 p-4 sm:px-8 sm:py-6 flex justify-between items-center z-10 sticky top-0">
                  <div>
                    <h4 className="font-syne font-bold text-lg sm:text-xl text-white">Catálogo de Boletos</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{activeRaffle.total_boletos} números en total</p>
                  </div>
                  <div className="bg-primary/20 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border border-primary/30 shadow-[0_0_15px_rgba(129,49,70,0.3)]">
                    {activeRaffle.total_boletos - takenTickets.length} Libres
                  </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-0 m-0">
                  <div className="divide-y divide-white/5 mx-auto">
                    {Array.from({ length: activeRaffle.total_boletos }).map((_, i) => {
                      const num = i + 1;
                      const isTaken = takenTickets.includes(num);
                      const owner = isTaken ? participants.find(p => p.boletos.includes(num)) : null;

                      return (
                        <div
                          key={num}
                          className={`
                            px-4 sm:px-8 py-5 flex items-center justify-between transition-colors group relative overflow-hidden
                            ${isTaken ? 'bg-black/20 text-white/50' : 'hover:bg-primary/5 cursor-pointer bg-transparent'}
                          `}
                        >
                          {/* Hover Effect for Available */}
                          {!isTaken && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}

                          {/* Left Side: Number & Owner */}
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`
                              w-12 h-12 rounded-xl flex items-center justify-center font-bold font-syne text-lg border shadow-sm
                              ${isTaken ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300'}
                            `}>
                              {num}
                            </div>
                            <div>
                              {isTaken ? (
                                <>
                                  <p className="font-bold text-white/40 line-through decoration-zinc-700 font-syne uppercase tracking-wide text-sm sm:text-base">Apartado</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate w-[140px] sm:w-[250px] italic">
                                    Por {owner?.nombre || "Anónimo"}
                                  </p>
                                </>
                              ) : (
                                <p className="font-bold text-white font-syne uppercase tracking-wide text-sm sm:text-base group-hover:text-primary transition-colors">Boleto Disponible</p>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Action/Status */}
                          <div className="relative z-10 shrink-0 ml-2">
                            {isTaken && (
                              <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-black/40">
                                No disponible
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Se eliminó el botón flotante de WhatsApp a petición del cliente */}
            </section>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="glass-panel mt-auto py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-syne font-bold">WHATSHOME RIFAS</span>
          </div>
          <p className="text-sm text-muted-foreground w-full sm:w-auto text-center">
            Página de Rifa © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
