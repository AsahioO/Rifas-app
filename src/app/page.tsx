"use client";

import { useEffect, useState, useRef } from "react";
import { Ticket as TicketIcon, Clock, Trophy, Phone, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { mockStore, type Raffle, type Participant } from "@/lib/store";

export default function LandingPage() {
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [takenTickets, setTakenTickets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiFired = useRef(false);

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#eab308', '#22c55e'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#eab308', '#22c55e'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  useEffect(() => {
    const fetchStats = async () => {
      const data = await mockStore.getActiveRaffle();
      setActiveRaffle(data);
      if (data) {
        setTakenTickets(await mockStore.getTakenTickets());
        setParticipants(await mockStore.getParticipants());

        // Disparar confeti una vez al cargar si ya finalizó
        if (data.estado === 'finalizada' && !confettiFired.current) {
          fireConfetti();
          confettiFired.current = true;
        }
      }
      setLoading(false);
    };

    fetchStats();

    // Auto-refresh
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

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
          Admin
        </a>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {loading ? (
          <div className="py-32 w-full text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground animate-pulse">Cargando Rifa Activa...</p>
          </div>
        ) : !activeRaffle ? (
          <div className="w-full flex-1 flex flex-col justify-center items-center py-32 px-6">
            <div className="w-full max-w-lg glass-panel p-12 rounded-[2rem] text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                <Trophy className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold font-syne">No hay rifas activas</h2>
              <p className="text-muted-foreground">La administración aún no ha publicado el próximo gran premio. Por favor vuelve más tarde para asegurar tu boleto.</p>
            </div>
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

              <div className="flex-1 w-full max-w-md relative group mt-8 md:mt-0">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                <div className="relative aspect-square rounded-3xl overflow-hidden glass-panel border border-white/10 p-3 sm:p-5">
                  <div className="w-full h-full bg-zinc-800/80 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    {activeRaffle.fotos && activeRaffle.fotos.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeRaffle.fotos[0]}
                        alt={activeRaffle.nombre}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm font-medium">Sin imagen</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

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
                            {isTaken ? (
                              <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-black/40">
                                No disponible
                              </div>
                            ) : (
                              <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" className="text-xs sm:text-sm uppercase tracking-wide font-bold bg-white/5 text-primary border border-primary/30 px-4 py-2 rounded-full hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(129,49,70,0.5)] transition-all">
                                Reservar
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-16 text-center">
                <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-green-500/50 px-8 py-5 rounded-full transition-all group hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                  <div className="bg-green-500/10 p-2 rounded-full group-hover:bg-green-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg leading-none">Reservar Boletos</div>
                    <div className="text-sm text-muted-foreground">Envíanos un mensaje y apártalos</div>
                  </div>
                </a>
              </div>
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
