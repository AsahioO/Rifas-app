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
      <header className="px-4 sm:px-6 py-4 flex justify-between items-center bg-brand-surface border-b border-brand-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-brand-accent" />
          <h1 className="font-serif font-bold text-2xl tracking-tighter text-brand-text">
            WHATSHOME<span className="text-brand-accent">RIFAS</span>
          </h1>
        </div>
        <a
          href="/admin/login"
          className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
        >
          Iniciar Sesión
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center bg-brand-bg safe-bottom">
        {loading ? (
          <div className="py-32 w-full text-center">
            <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brand-muted animate-pulse">Cargando Rifa Activa...</p>
          </div>
        ) : !activeRaffle ? (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center py-16">
            {lastFinished && lastFinished.ganador_nombre && lastFinished.ganador_nombre !== 'Cancelada' ? (
              /* ===== PERSISTENT WINNER VIEW ===== */
              <div className="w-full max-w-3xl space-y-8 text-center animate-in fade-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
                  <div className="bg-brand-surface p-10 sm:p-14 rounded-2xl border border-brand-border relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent" />

                    <PartyPopper className="w-16 h-16 text-brand-accent mx-auto mb-6 animate-bounce" />
                    <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-accent drop-shadow-sm mb-4">
                      ¡Tenemos Ganador!
                    </h2>
                    <p className="text-brand-muted mb-8 text-lg">La rifa <strong className="text-brand-text">{lastFinished.nombre}</strong> ha concluido</p>

                    <div className="bg-brand-bg p-8 rounded-xl border border-brand-border inline-block mx-auto shadow-sm">
                      <p className="text-brand-accent text-7xl sm:text-8xl font-bold font-serif mb-3">#{lastFinished.ganador_boleto}</p>
                      <p className="text-brand-text text-2xl sm:text-3xl font-bold">{lastFinished.ganador_nombre}</p>
                      <p className="text-brand-muted mt-2 text-sm uppercase tracking-widest">Boleto Ganador</p>
                    </div>

                    {lastFinished.fotos && lastFinished.fotos.length > 0 && (
                      <div className="mt-10 max-w-sm mx-auto">
                        <div className="aspect-square rounded-xl overflow-hidden border border-brand-border shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={lastFinished.fotos[0]} alt="Premio" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-brand-muted text-sm mt-3">{lastFinished.descripcion}</p>
                      </div>
                    )}

                    <p className="text-brand-muted/70 text-xs mt-10 uppercase tracking-widest">¡Felicidades! Pronto habrá una nueva rifa...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-brand-surface p-12 rounded-xl text-center border-dashed border-2 border-brand-border flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center text-brand-muted">
                  <Trophy className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold font-serif text-brand-text">No hay rifas activas</h2>
                <p className="text-brand-muted leading-relaxed">La administración aún no ha publicado el próximo gran premio. Por favor vuelve más tarde para asegurar tu boleto.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* HERO SECTION */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-center md:text-left z-10">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                  {activeRaffle.estado === 'activa' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface border border-brand-border shadow-sm text-brand-accent text-sm font-medium animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-brand-accent" />
                      Rifa Activa
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface border border-brand-accent/50 text-brand-accent text-sm font-medium animate-bounce shadow-sm">
                      <PartyPopper className="w-4 h-4" />
                      ¡Rifa Finalizada Exitosamente!
                    </div>
                  )}

                  {activeRaffle.regalo_incluido && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-wine/10 border border-brand-wine/30 text-brand-wine text-sm font-bold shadow-sm hover:scale-105 hover:shadow-[0_0_15px_rgba(114,47,55,0.2)] transition-transform cursor-default">
                      🎁 Regalo Extra: {activeRaffle.regalo_incluido}
                    </div>
                  )}
                </div>

                <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-brand-text">
                  {activeRaffle.nombre}
                </h2>

                <p className="text-lg md:text-xl text-brand-muted max-w-xl mx-auto md:mx-0 text-balance whitespace-pre-wrap leading-relaxed">
                  {activeRaffle.descripcion}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
                  <div className="bg-brand-surface px-6 py-4 rounded-xl flex flex-col items-center border border-brand-border shadow-sm">
                    <span className="text-xs uppercase tracking-wider text-brand-muted">Estado Actual</span>
                    <span className={`text-xl font-bold flex items-center gap-2 ${activeRaffle.estado === 'activa' ? 'text-brand-accent' : 'text-brand-wine'}`}>
                      {activeRaffle.estado === 'activa' ? <Clock className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                      {activeRaffle.estado === 'activa' ? "En Venta" : "Rifa Concluida"}
                    </span>
                  </div>
                </div>

                {activeRaffle.estado === 'finalizada' && activeRaffle.ganador_boleto ? (
                  <div className="pt-8 w-full md:w-auto">
                    <div className="w-full sm:w-auto inline-flex items-center justify-center gap-6 bg-brand-accent/10 border border-brand-accent/30 px-8 py-6 rounded-full font-bold transition-all shadow-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-brand-accent/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out skew-x-12" />
                      <div className="w-16 h-16 rounded-full bg-brand-accent text-white flex items-center justify-center text-3xl font-serif z-10">
                        #{activeRaffle.ganador_boleto}
                      </div>
                      <div className="text-left z-10">
                        <div className="text-sm font-medium text-brand-accent uppercase tracking-widest font-serif">Gran Ganador</div>
                        <div className="text-2xl text-brand-text h-[28px]">{activeRaffle.ganador_nombre}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-8 w-full md:w-auto flex flex-col gap-8">
                    <a href="#boletos" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-text text-brand-surface px-8 py-4 rounded-lg font-bold text-lg transition-all hover:bg-brand-wine hover:text-white hover:shadow-[0_0_20px_rgba(114,47,55,0.4)] hover:scale-105 active:scale-95">
                      <TicketIcon className="w-6 h-6" />
                      Ver {activeRaffle.total_boletos} Boletos
                    </a>

                    {activeRaffle.fotos_regalo && activeRaffle.fotos_regalo.length > 0 && (
                      <div className="space-y-4 max-w-sm mt-4 text-left mx-auto md:mx-0">
                        <h3 className="font-serif text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-brand-wine">
                          🎁 Regalo Extra: {activeRaffle.regalo_incluido}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {activeRaffle.fotos_regalo.map((url, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-brand-border shadow-sm group relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Regalo Extra ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full max-w-[320px] sm:max-w-md relative group mt-8 md:mt-0 mx-auto">
                <div className="absolute inset-0 bg-brand-accent/5 blur-[100px] rounded-full group-hover:bg-brand-accent/10 transition-all duration-700" />
                <div className="relative aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-brand-surface border border-brand-border p-2 sm:p-5 shadow-md">
                  <div className="w-full h-full bg-brand-bg rounded-xl flex items-center justify-center overflow-hidden relative border border-brand-border">
                    {activeRaffle.fotos && activeRaffle.fotos.length > 0 ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeRaffle.fotos[currentImageIndex]}
                          alt={`${activeRaffle.nombre} - vista ${currentImageIndex + 1}`}
                          className="object-cover w-full h-full transition-all duration-500 ease-in-out group-hover:scale-105"
                        />

                        {/* Controls (only if multiple images) */}
                        {activeRaffle.fotos.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-brand-surface/90 text-brand-text hover:bg-brand-surface active:bg-brand-surface active:scale-90 backdrop-blur transition-all opacity-0 group-hover:opacity-100 shadow-md border border-brand-border"
                              aria-label="Anterior imagen"
                            >
                              <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-brand-surface/90 text-brand-text hover:bg-brand-surface active:bg-brand-surface active:scale-90 backdrop-blur transition-all opacity-0 group-hover:opacity-100 shadow-md border border-brand-border"
                              aria-label="Siguiente imagen"
                            >
                              <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-brand-surface/80 px-3 py-2 rounded-full backdrop-blur-sm border border-brand-border shadow-sm">
                              {activeRaffle.fotos.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  onClick={() => setCurrentImageIndex(dotIdx)}
                                  className={`h-2 rounded-full transition-all duration-300 ${dotIdx === currentImageIndex ? 'bg-brand-accent w-6' : 'bg-brand-muted/40 hover:bg-brand-muted/80 w-2'} active:scale-90`}
                                  style={{ minWidth: '8px', minHeight: '8px', padding: '4px' }}
                                  aria-label={`Ir a imagen ${dotIdx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-brand-muted text-sm font-medium">Sin imagen</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ===== LIVE ROULETTE SECTION ===== */}
            {liveActive && (
              <section ref={liveRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-brand-sale/50 to-transparent" />

                <div className="text-center space-y-2 mb-10">
                  <div className="inline-flex items-center gap-2 bg-brand-sale/10 text-brand-sale border border-brand-sale/20 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
                    <div className="w-2 h-2 bg-brand-sale rounded-full" />
                    En Vivo
                  </div>
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text">¡El Sorteo está ocurriendo ahora!</h3>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                  {/* Live Wheel */}
                  <div className="relative w-[280px] sm:w-[350px] aspect-square mx-auto">
                    <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${liveWinner ? 'bg-brand-accent/50 scale-125' : 'bg-brand-accent/30 scale-100'}`} />

                    {/* Pointer */}
                    {!liveWinner && (
                      <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 z-40">
                        <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-l-transparent border-r-[15px] sm:border-r-[20px] border-r-transparent border-t-[30px] sm:border-t-[40px] border-t-brand-accent drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)]" />
                      </div>
                    )}

                    {/* Wheel */}
                    <div
                      className={`absolute inset-0 rounded-full shadow-2xl overflow-hidden bg-brand-surface
                        ${liveIsResetting ? 'duration-0' : 'transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}
                        ${liveWinner ? 'border-4 sm:border-8 border-brand-accent shadow-[0_0_50px_rgba(200,169,110,0.3)]' : 'border-4 sm:border-8 border-brand-border'}
                      `}
                      style={{ transform: `rotate(${liveRotation}deg)` }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {liveSlices.length === 1 ? (
                          <>
                            <circle cx="50" cy="50" r="50" fill="#E8E4DF" />
                            <text x="50" y="50" fill="#1A1A1A" fontSize="4" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
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
                            const colors = ['#F7F5F2', '#E8E4DF', '#FFFFFF'];
                            const fontSize = N < 10 ? 4 : N < 20 ? 3 : N < 40 ? 2 : 1.5;

                            return (
                              <g key={`live-${slice.boleto}-${i}`}>
                                <path d={pathData} fill={colors[i % colors.length]} stroke="rgba(26,26,26,0.1)" strokeWidth="0.5" />
                                <text x="50" y="50" fill="#1A1A1A" fontSize={fontSize} fontWeight="bold" textAnchor="end" dominantBaseline="middle"
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
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-brand-bg border-2 sm:border-4 border-brand-border rounded-full z-20 shadow-lg" />
                    )}

                    {/* Eliminated Overlay */}
                    {liveSpunCard && !liveWinner && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-brand-surface/90 backdrop-blur-sm rounded-full animate-in zoom-in duration-300 border border-brand-border">
                        <div className="text-center px-4">
                          <h3 className="text-brand-sale font-bold text-3xl sm:text-4xl font-serif uppercase drop-shadow-sm">¡Eliminado!</h3>
                          <p className="text-brand-text text-2xl sm:text-3xl mt-2 font-bold">#{liveSpunCard.boleto}</p>
                          <p className="text-brand-muted truncate w-full mt-1 text-sm sm:text-lg">{liveSpunCard.nombre}</p>
                        </div>
                      </div>
                    )}

                    {/* Winner Overlay */}
                    {liveWinner && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-brand-surface/95 backdrop-blur-md rounded-full animate-in zoom-in duration-700 border-4 border-brand-accent">
                        <PartyPopper className="w-10 h-10 sm:w-14 sm:h-14 text-brand-accent mb-2 animate-bounce" />
                        <h3 className="text-brand-accent font-bold text-3xl sm:text-4xl font-serif uppercase drop-shadow-sm">¡GANADOR!</h3>
                        <p className="text-brand-text text-4xl sm:text-5xl font-bold mt-2 font-serif">#{liveWinner.boleto}</p>
                        <p className="text-brand-text/90 text-base sm:text-xl mt-2 truncate px-6 w-full text-center">{liveWinner.nombre}</p>
                      </div>
                    )}
                  </div>

                  {/* Eliminated List */}
                  {liveEliminated.length > 0 && (
                    <div className="w-full lg:max-w-xs bg-brand-surface p-6 rounded-xl border border-brand-border shadow-sm max-h-[350px] overflow-y-auto space-y-2">
                      <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-brand-muted mb-3">Eliminados</h4>
                      {liveEliminated.map((el, idx) => (
                        <div key={`live-el-${el.boleto}-${idx}`} className="flex items-center justify-between p-3 bg-brand-sale/5 border border-brand-sale/10 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-sale/10 text-brand-sale flex items-center justify-center font-bold text-xs">{el.intento}°</span>
                            <span className="text-brand-muted line-through">#{el.boleto}</span>
                          </div>
                          <span className="text-xs text-brand-sale/80 font-bold uppercase">Agua</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* BOLETOS GRID */}
            <section id="boletos" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-brand-border relative">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />

              <div className="text-center space-y-4 mb-16">
                <h3 className="font-serif text-4xl sm:text-5xl font-bold text-brand-text">Elige tu número de la suerte</h3>
                <p className="text-brand-muted text-lg">Contacta por WhatsApp para asegurar tu reserva antes que nadie.</p>
                <div className="flex items-center justify-center gap-8 text-sm text-brand-muted pt-4">
                  <div className="flex items-center gap-2 font-medium"><div className="w-4 h-4 rounded bg-brand-bg border border-brand-accent shadow-sm" /> Disponible</div>
                  <div className="flex items-center gap-2 font-medium opacity-70"><div className="w-4 h-4 rounded bg-brand-surface border border-brand-border" /> Ocupado</div>
                </div>
              </div>

              {/* New Vertical List Layout */}
              <div className="max-w-3xl mx-auto w-full bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-sm flex flex-col h-[600px]">
                {/* Panel Header */}
                <div className="bg-brand-bg/95 backdrop-blur-md border-b border-brand-border p-4 sm:px-8 sm:py-6 flex justify-between items-center z-10 sticky top-0">
                  <div>
                    <h4 className="font-serif font-bold text-lg sm:text-xl text-brand-text">Catálogo de Boletos</h4>
                    <p className="text-xs sm:text-sm text-brand-muted">{activeRaffle.total_boletos} números en total</p>
                  </div>
                  <div className="bg-brand-accent/10 text-brand-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border border-brand-accent/30">
                    {activeRaffle.total_boletos - takenTickets.length} Libres
                  </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-0 m-0 overscroll-contain">
                  <div className="divide-y divide-brand-border mx-auto">
                    {Array.from({ length: activeRaffle.total_boletos }).map((_, i) => {
                      const num = i + 1;
                      const isTaken = takenTickets.includes(num);
                      const owner = isTaken ? participants.find(p => p.boletos.includes(num)) : null;

                      return (
                        <div
                          key={num}
                          className={`
                              px-4 sm:px-8 py-5 flex items-center justify-between transition-colors group relative overflow-hidden
                              ${isTaken ? 'bg-brand-bg/50 text-brand-muted' : 'hover:bg-brand-accent/5 active:bg-brand-accent/10 cursor-pointer bg-transparent'}
                            `}
                        >
                          {/* Hover Effect for Available */}
                          {!isTaken && (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/0 via-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}

                          {/* Left Side: Number & Owner */}
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center font-bold font-serif text-lg border shadow-sm shrink-0
                                ${isTaken ? 'bg-brand-surface border-brand-border text-brand-muted/70' : 'bg-brand-bg border-brand-accent/30 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all duration-300'}
                              `}>
                              {num}
                            </div>
                            <div className="min-w-0 pr-2">
                              {isTaken ? (
                                <>
                                  <p className="font-bold text-brand-muted line-through font-serif uppercase tracking-wide text-xs sm:text-base">Apartado</p>
                                  <p className="text-xs sm:text-sm text-brand-muted/70 truncate w-[120px] sm:w-[250px] italic">
                                    Por {owner?.nombre || "Anónimo"}
                                  </p>
                                </>
                              ) : (
                                <p className="font-bold text-brand-text font-serif uppercase tracking-wide text-sm sm:text-base group-hover:text-brand-accent transition-colors">Boleto Disponible</p>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Action/Status */}
                          <div className="relative z-10 shrink-0 ml-2">
                            {isTaken && (
                              <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-brand-muted/70 px-3 py-1.5 rounded-full border border-brand-border bg-brand-surface">
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
      <footer className="bg-brand-surface border-t border-brand-border mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-accent" />
            <span className="font-serif font-bold text-brand-text tracking-widest uppercase">WHATSHOME RIFAS</span>
          </div>
          <p className="text-sm text-brand-muted w-full sm:w-auto text-center">
            Catálogo de Rifa © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
