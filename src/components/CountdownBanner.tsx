"use client";

import { memo, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { getCountdownDetails } from "@/lib/datetime";

type CountdownBannerProps = {
  scheduledDate: string | null | undefined;
};

export const CountdownBanner = memo(function CountdownBanner({
  scheduledDate,
}: CountdownBannerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!scheduledDate) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [scheduledDate]);

  const countdown = getCountdownDetails(scheduledDate, now);
  if (!countdown) return null;

  return (
    <section
      aria-label="Cuenta regresiva del sorteo"
      className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8"
    >
      <div className="public-reveal relative overflow-hidden rounded-[1.5rem] border border-brand-border bg-brand-surface px-4 py-4 shadow-[0_16px_42px_rgba(69,52,25,0.07)] sm:px-6 sm:py-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-accent/25 bg-[#faf5e9] text-brand-accent">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-accent">
                Próximo sorteo
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-text sm:text-base">
                {countdown.isStarted
                  ? "El sorteo está por comenzar"
                  : countdown.scheduledLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-[#f8f5ef] px-3 py-2.5 sm:min-w-[184px] sm:justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted sm:hidden">
              Restante
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted sm:inline">
              Tiempo restante
            </span>
            <span className="font-mono text-2xl font-semibold tracking-[-0.08em] tabular-nums text-brand-text sm:block sm:text-3xl">
              {countdown.formatted}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
