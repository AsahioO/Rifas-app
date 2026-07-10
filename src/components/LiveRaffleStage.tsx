"use client";

import { memo, useMemo } from "react";
import { Radio, Sparkles, Trophy, XCircle } from "lucide-react";
import { RaffleWheel, type WheelSlice } from "@/components/RaffleWheel";
import type { LiveDrawPhase, LiveEntry, LiveSlice } from "@/lib/live-draw";

type LiveRaffleStageProps = {
  slices: WheelSlice[];
  eliminated: LiveEntry[];
  winner: LiveSlice | null;
  rotation: number;
  currentAttempt: number;
  totalAttempts: number;
  isResetting: boolean;
  phase: LiveDrawPhase;
  result: LiveSlice | null;
  consolationPrize: string | null;
};

const DrawMoment = memo(function DrawMoment({ phase, result, winner, currentAttempt, totalAttempts, consolationPrize }: Pick<LiveRaffleStageProps, "phase" | "result" | "winner" | "currentAttempt" | "totalAttempts" | "consolationPrize">) {
  if (phase === "spinning") {
    return (
      <div className="live-moment live-moment--spinning" aria-live="polite">
        <span className="live-moment-icon"><Radio className="h-4 w-4" /></span>
        <span><strong>Girando ahora</strong><small>Intento {currentAttempt} de {totalAttempts}</small></span>
      </div>
    );
  }

  if ((phase === "revealing" || phase === "ready") && result) {
    return (
      <div key={`out-${result.boleto}-${currentAttempt}`} className="live-moment live-moment--out" role="status" aria-live="polite">
        <span className="live-moment-icon"><XCircle className="h-4 w-4" /></span>
        <span className="min-w-0"><small>Boleto fuera · intento {currentAttempt} de {totalAttempts}</small><strong className="truncate">#{result.boleto} <em>{result.nombre}</em></strong>{consolationPrize && <small className="mt-0.5 text-[#c9ad6f]">Regalo sorpresa: {consolationPrize}</small>}</span>
      </div>
    );
  }

  if (phase === "winner" && winner) {
    return (
      <div key={`winner-${winner.boleto}`} className="live-moment live-moment--winner" role="status" aria-live="polite">
        <span className="live-moment-icon"><Trophy className="h-4 w-4" /></span>
        <span className="min-w-0"><small>Ganador confirmado</small><strong className="truncate">#{winner.boleto} <em>{winner.nombre}</em></strong></span>
      </div>
    );
  }

  return <div className="live-moment live-moment--ready"><span className="live-moment-icon"><Sparkles className="h-4 w-4" /></span><span><strong>Preparando el siguiente giro</strong><small>La ruleta está lista.</small></span></div>;
});

export const LiveRaffleStage = memo(function LiveRaffleStage({
  slices,
  eliminated,
  winner,
  rotation,
  currentAttempt,
  totalAttempts,
  isResetting,
  phase,
  result,
  consolationPrize,
}: LiveRaffleStageProps) {
  const latestEntries = useMemo(() => [...eliminated].reverse(), [eliminated]);

  return (
    <section className="live-stage relative isolate overflow-hidden px-4 py-4 text-[#fffaf0] sm:px-6 sm:py-6 lg:px-8">
      <div className="live-stage-light pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl">
        <header className="live-status-bar">
          <div className="flex min-w-0 items-center gap-2.5"><span className="live-status-dot" /><span className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-[#efd18b]">Sorteo en vivo</span></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-[#c6b690] sm:inline">{phase === "spinning" ? "La ruleta está girando" : phase === "winner" ? "Tenemos ganador" : "Resultado confirmado"}</span><span className="rounded-full border border-[#675436] bg-[#211a11] px-3 py-1 font-mono text-sm font-semibold tabular-nums text-[#fff0c2]">{Math.min(currentAttempt, totalAttempts)}/{totalAttempts}</span></div>
        </header>

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center">
          <div className="min-w-0">
            <div className="live-wheel-frame">
              <RaffleWheel
                slices={slices}
                rotation={rotation}
                isResetting={isResetting}
                result={result}
                winner={winner}
                currentAttempt={currentAttempt}
                totalAttempts={totalAttempts}
                isDrawing={phase === "spinning"}
                showNames
                centerLabel="LIVE"
                presentation="live"
                className="mx-auto w-full max-w-[31rem]"
              />
            </div>
            <div className="mx-auto mt-4 max-w-[31rem]"><DrawMoment phase={phase} result={result} winner={winner} currentAttempt={currentAttempt} totalAttempts={totalAttempts} consolationPrize={consolationPrize} /></div>
          </div>

          <aside className="live-history">
            <details open>
              <summary><span><small>Registro de giros</small><strong>Resultados</strong></span><span className="font-mono text-xs tabular-nums text-[#c6b690]">{eliminated.length} fuera</span></summary>
              <div className="custom-scrollbar mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                {latestEntries.map((entry) => (
                  <div key={`${entry.boleto}-${entry.intento}`} className="live-history-item">
                    <div className="min-w-0"><p className="font-mono text-sm font-semibold text-[#fffaf0]">#{entry.boleto}</p><p className="truncate text-xs text-[#c6b690]">{entry.nombre}</p></div>
                    <span>{entry.intento}° fuera</span>
                  </div>
                ))}
                {latestEntries.length === 0 && <p className="rounded-xl border border-dashed border-[#675436] px-4 py-7 text-center text-sm text-[#c6b690]">El registro aparecerá con el primer giro.</p>}
              </div>
            </details>
          </aside>
        </div>
      </div>
    </section>
  );
});
