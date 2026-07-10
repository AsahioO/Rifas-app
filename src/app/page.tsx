"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PartyPopper, Trophy } from "lucide-react";
import { mockStore, type Participant, type Raffle } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import type { LiveDrawPhase } from "@/lib/live-draw";
import { LiveRaffleStage } from "@/components/LiveRaffleStage";
import { PublicRaffleHero } from "@/components/PublicRaffleHero";
import { TicketCatalog } from "@/components/TicketCatalog";

type LiveSlice = { boleto: number; nombre: string };
type LiveEntry = LiveSlice & { intento: number };

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFinished, setLastFinished] = useState<Raffle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const confettiFired = useRef(false);

  const [liveActive, setLiveActive] = useState(false);
  const [liveRotation, setLiveRotation] = useState(0);
  const [liveSlices, setLiveSlices] = useState<LiveSlice[]>([]);
  const [liveEliminated, setLiveEliminated] = useState<LiveEntry[]>([]);
  const [liveWinner, setLiveWinner] = useState<LiveSlice | null>(null);
  const [liveConsolationPrize, setLiveConsolationPrize] = useState<string | null>(null);
  const [liveIsResetting, setLiveIsResetting] = useState(false);
  const [liveIsDrawing, setLiveIsDrawing] = useState(false);
  const [liveSpunCard, setLiveSpunCard] = useState<LiveSlice | null>(null);
  const [liveAttempt, setLiveAttempt] = useState(1);
  const [liveTotalAttempts, setLiveTotalAttempts] = useState(1);
  const liveRef = useRef<HTMLDivElement>(null);
  const liveTimeouts = useRef<number[]>([]);
  const hasAutoScrolledLive = useRef(false);

  const clearLiveTimeouts = useCallback(() => {
    liveTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
    liveTimeouts.current = [];
  }, []);

  const scheduleLiveUpdate = useCallback((callback: () => void, delay: number) => {
    const timeout = window.setTimeout(() => {
      liveTimeouts.current = liveTimeouts.current.filter((id) => id !== timeout);
      callback();
    }, delay);
    liveTimeouts.current.push(timeout);
  }, []);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeRaffle?.id]);

  const fireConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#c8a96e", "#813146"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#c8a96e", "#813146"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (!liveActive || hasAutoScrolledLive.current) return;
    hasAutoScrolledLive.current = true;
    const raf = requestAnimationFrame(() => {
      liveRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [liveActive, reduceMotion]);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const raffle = await mockStore.getActiveRaffle();
        if (!mounted) return;

        setActiveRaffle(raffle);
        if (raffle) {
          const raffleParticipants = await mockStore.getParticipants(raffle.id);
          if (!mounted) return;
          setParticipants(raffleParticipants);
          setLastFinished(null);
        } else {
          setParticipants([]);
          const finished = await mockStore.getLastFinishedRaffle();
          if (mounted) setLastFinished(finished);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchStats();
    const fallbackInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchStats();
    }, 30_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void fetchStats();
    };
    document.addEventListener("visibilitychange", refreshOnFocus);

    const channel = supabase.channel("sorteo-live");
    channel.on("broadcast", { event: "sorteo" }, ({ payload }) => {
      const event = payload.evento as string;

      if (event === "girando") {
        const slices = Array.isArray(payload.slices) ? payload.slices as LiveSlice[] : [];
        if (slices.length === 0) return;
        const attempt = Number(payload.intento) || 1;
        const totalAttempts = Number(payload.totalIntentos) || attempt;
        setLiveActive(true);
        setLiveWinner(null);
        setLiveSpunCard(null);
        setLiveIsResetting(false);
        setLiveIsDrawing(true);
        setLiveAttempt(attempt);
        setLiveTotalAttempts(totalAttempts);
        if (attempt === 1) {
          setLiveEliminated([]);
          hasAutoScrolledLive.current = false;
          confettiFired.current = false;
        }
        setLiveConsolationPrize(payload.premioConsolacion ? String(payload.premioConsolacion) : null);
        setLiveSlices(slices);
        setLiveRotation(Number(payload.rotation) || 0);
      }

      if (event === "eliminado") {
        const entry = { boleto: Number(payload.boleto), nombre: String(payload.nombre || "Anónimo") };
        const attempt = Number(payload.intento) || 1;
        setLiveAttempt(attempt);
        setLiveSpunCard(entry);
        setLiveIsDrawing(false);
        scheduleLiveUpdate(() => {
          setLiveEliminated((previous) => [...previous, { ...entry, intento: attempt }]);
          setLiveSlices((previous) => previous.filter((slice) => slice.boleto !== entry.boleto));
        }, 1500);
      }

      if (event === "reset") {
        setLiveIsResetting(true);
        setLiveRotation(0);
        setLiveIsDrawing(false);
        scheduleLiveUpdate(() => setLiveIsResetting(false), 50);
      }

      if (event === "ganador") {
        setLiveWinner({ boleto: Number(payload.boleto), nombre: String(payload.nombre || "Anónimo") });
        setLiveSpunCard(null);
        setLiveConsolationPrize(null);
        setLiveIsDrawing(false);
        if (!confettiFired.current) {
          confettiFired.current = true;
          void fireConfetti();
        }
      }
    })
      .on("postgres_changes", { event: "*", schema: "public", table: "rifas" }, () => {
        void fetchStats();
      })
      .subscribe();

    return () => {
      mounted = false;
      window.clearInterval(fallbackInterval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      clearLiveTimeouts();
      supabase.removeChannel(channel);
    };
  }, [clearLiveTimeouts, fireConfetti, reduceMotion, scheduleLiveUpdate]);

  const availableTickets = useMemo(() => {
    if (!activeRaffle) return 0;
    const taken = new Set(participants.flatMap((participant) => participant.boletos.filter((boleto) => boleto >= 1 && boleto <= activeRaffle.total_boletos)));
    return Math.max(0, activeRaffle.total_boletos - taken.size);
  }, [activeRaffle, participants]);
  const livePhase: LiveDrawPhase = liveWinner
    ? "winner"
    : liveIsDrawing
      ? "spinning"
      : liveSpunCard
        ? "revealing"
        : "ready";

  const nextImage = useCallback(() => {
    if (!activeRaffle?.fotos.length) return;
    setCurrentImageIndex((current) => (current + 1) % activeRaffle.fotos.length);
  }, [activeRaffle?.fotos.length]);
  const previousImage = useCallback(() => {
    if (!activeRaffle?.fotos.length) return;
    setCurrentImageIndex((current) => (current - 1 + activeRaffle.fotos.length) % activeRaffle.fotos.length);
  }, [activeRaffle?.fotos.length]);

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-bg text-brand-text">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-text focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white">Saltar al contenido</a>
      <header className="safe-top sticky top-0 z-50 border-b border-[#e6ded0] bg-[#fffdf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5"><Trophy className="h-6 w-6 text-brand-accent" strokeWidth={1.8} /><span className="text-lg font-semibold tracking-[-0.055em] text-brand-text sm:text-xl">WHATSHOME<span className="text-brand-accent">RIFAS</span></span></div>
          <a href="/admin/login" className="rounded-md px-2 py-1 text-xs font-medium text-brand-muted/70 transition hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Administración</a>
        </div>
      </header>

      <main id="contenido" className="min-h-[calc(100dvh-4rem)] pb-20 md:pb-0">
        {loading ? (
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"><div className="h-20 animate-pulse rounded-[1.5rem] bg-[#eae3d7]" /><div className="mt-10 grid items-center gap-8 lg:grid-cols-2"><div className="space-y-4"><div className="h-4 w-28 animate-pulse rounded bg-[#eae3d7]" /><div className="h-20 max-w-xl animate-pulse rounded-[1.25rem] bg-[#e7dfd2]" /><div className="h-12 max-w-lg animate-pulse rounded bg-[#eae3d7]" /></div><div className="mx-auto aspect-[4/5] w-full max-w-md animate-pulse rounded-[2rem] bg-[#e7dfd2]" /></div></div>
        ) : activeRaffle ? (
          <div className="flex flex-col">
            <div className="order-2 lg:order-1">
              <PublicRaffleHero raffle={activeRaffle} scheduledDate={activeRaffle.fecha_sorteo} availableTickets={availableTickets} currentImageIndex={Math.min(currentImageIndex, Math.max(0, activeRaffle.fotos.length - 1))} onPreviousImage={previousImage} onNextImage={nextImage} onSelectImage={setCurrentImageIndex} />
            </div>
            {liveActive && (
              <div ref={liveRef} className="order-1 lg:order-2">
                <LiveRaffleStage slices={liveSlices} eliminated={liveEliminated} winner={liveWinner} rotation={liveRotation} currentAttempt={liveAttempt} totalAttempts={liveTotalAttempts} isResetting={liveIsResetting} phase={livePhase} result={liveSpunCard} consolationPrize={liveConsolationPrize} />
              </div>
            )}
            <div className="order-3">
              <TicketCatalog totalTickets={activeRaffle.total_boletos} participants={participants} />
            </div>
          </div>
        ) : lastFinished?.ganador_nombre && lastFinished.ganador_nombre !== "Cancelada" ? (
          <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8"><motion.article initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid w-full overflow-hidden rounded-[2rem] border border-[#e0d5c3] bg-[#fffdf8] shadow-[0_24px_60px_rgba(69,52,25,0.11)] lg:grid-cols-[0.9fr_1.1fr]"><div className="order-2 p-7 sm:p-12 lg:order-1 lg:p-16"><PartyPopper className="h-9 w-9 text-brand-accent" /><p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-brand-accent">Rifa finalizada</p><h1 className="mt-3 text-balance font-serif text-5xl font-semibold tracking-[-0.065em] text-brand-text sm:text-6xl">Tenemos un ganador</h1><p className="mt-4 max-w-md text-base leading-7 text-brand-muted">{lastFinished.nombre} concluyó. El boleto ganador ya está confirmado.</p><div className="mt-8 inline-flex items-center gap-5 rounded-2xl border border-[#eadcb9] bg-[#fbf4e5] px-5 py-4"><span className="font-mono text-5xl font-semibold tracking-[-0.08em] text-[#8f7031]">{lastFinished.ganador_boleto}</span><span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b7c39]">Ganador</span><span className="mt-1 block max-w-[13rem] truncate text-lg font-semibold text-brand-text">{lastFinished.ganador_nombre}</span></span></div></div><div className="order-1 min-h-[19rem] bg-[#e9dfcc] lg:order-2 lg:min-h-full">{lastFinished.fotos?.[0] ? <img src={lastFinished.fotos[0]} alt={`Premio de ${lastFinished.nombre}`} className="h-full w-full object-cover" loading="eager" decoding="async" /> : <div className="flex h-full items-center justify-center text-brand-muted">Rifa finalizada</div>}</div></motion.article></section>
        ) : (
          <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8"><motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4ead5] text-brand-accent"><Trophy className="h-7 w-7" /></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-brand-accent">Próxima rifa</p><h1 className="mt-3 text-balance font-serif text-5xl font-semibold tracking-[-0.065em] text-brand-text sm:text-6xl">Estamos preparando el próximo premio.</h1><p className="mt-5 max-w-lg text-base leading-7 text-brand-muted">Vuelve pronto para consultar los números de la siguiente rifa.</p></motion.div></section>
        )}
      </main>

      <footer className="border-t border-[#e6ded0] bg-[#fffdf8] py-7"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-sm text-brand-muted sm:flex-row sm:px-6 sm:text-left lg:px-8"><span className="font-semibold tracking-[-0.03em] text-brand-text">WHATSHOME RIFAS</span><span>Catálogo de rifas © {new Date().getFullYear()}</span></div></footer>
    </div>
  );
}
