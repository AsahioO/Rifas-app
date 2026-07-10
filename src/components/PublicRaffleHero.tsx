"use client";

import { useCallback, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Gift, Maximize2, Ticket, Tickets, X } from "lucide-react";
import type { Raffle } from "@/lib/store";
import type { CountdownDetails } from "@/lib/datetime";

type PublicRaffleHeroProps = {
  raffle: Raffle;
  countdown: CountdownDetails | null;
  availableTickets: number;
  currentImageIndex: number;
  onPreviousImage: () => void;
  onNextImage: () => void;
  onSelectImage: (index: number) => void;
};

const formatPrice = (value: number) => new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
}).format(value);

export function PublicRaffleHero({
  raffle,
  countdown,
  availableTickets,
  currentImageIndex,
  onPreviousImage,
  onNextImage,
  onSelectImage,
}: PublicRaffleHeroProps) {
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isClosingRef = useRef(false);
  const imageCount = raffle.fotos.length;
  const soldTickets = Math.max(0, raffle.total_boletos - availableTickets);

  const openImageDialog = useCallback(() => {
    const dialog = imageDialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.removeAttribute("data-closing");
    dialog.showModal();
  }, []);

  const closeImageDialog = useCallback(() => {
    const dialog = imageDialogRef.current;
    if (!dialog?.open || isClosingRef.current) return;
    isClosingRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      isClosingRef.current = false;
      triggerRef.current?.focus();
      return;
    }

    const finishClosing = () => {
      isClosingRef.current = false;
      dialog.close();
      triggerRef.current?.focus();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== dialog || event.propertyName !== "opacity") return;
      window.clearTimeout(fallback);
      dialog.removeEventListener("transitionend", onTransitionEnd);
      finishClosing();
    };

    const fallback = window.setTimeout(() => {
      dialog.removeEventListener("transitionend", onTransitionEnd);
      finishClosing();
    }, 260);

    dialog.setAttribute("data-closing", "");
    dialog.addEventListener("transitionend", onTransitionEnd);
  }, []);

  return (
    <>
      {countdown && (
        <section aria-label="Cuenta regresiva del sorteo" className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <div className="public-reveal relative overflow-hidden rounded-[1.5rem] border border-brand-border bg-brand-surface px-4 py-4 shadow-[0_16px_42px_rgba(69,52,25,0.07)] sm:px-6 sm:py-5">
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-brand-accent/10 blur-3xl" />
            <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-accent/25 bg-[#faf5e9] text-brand-accent">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-accent">Próximo sorteo</p>
                  <p className="mt-1 text-sm font-semibold text-brand-text sm:text-base">
                    {countdown.isStarted ? "El sorteo está por comenzar" : countdown.scheduledLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-[#f8f5ef] px-3 py-2.5 sm:min-w-[184px] sm:justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted sm:hidden">Restante</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted sm:inline">Tiempo restante</span>
                <span className="font-mono text-2xl font-semibold tracking-[-0.08em] tabular-nums text-brand-text sm:block sm:text-3xl">{countdown.formatted}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,0.72fr)] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="public-reveal public-reveal-delay-1 order-2 lg:order-1">
          <div className="flex items-center gap-3 text-xs font-semibold text-brand-accent">
            <span className="flex h-2 w-2 rounded-full bg-brand-accent shadow-[0_0_0_5px_rgba(200,169,110,0.16)]" />
            <span className="uppercase tracking-[0.2em]">Rifa en venta</span>
          </div>

          <h1 className="mt-5 max-w-3xl text-balance font-serif text-4xl font-semibold leading-[0.94] tracking-[-0.065em] text-brand-text sm:text-6xl lg:text-7xl">
            {raffle.nombre}
          </h1>

          <p className="mt-5 max-w-2xl whitespace-pre-wrap text-pretty text-base leading-7 text-brand-muted sm:text-lg sm:leading-8">
            {raffle.descripcion}
          </p>

          <div className="mt-7 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand-border bg-brand-border shadow-[0_12px_30px_rgba(69,52,25,0.05)]">
            <div className="bg-brand-surface px-4 py-4 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Por boleto</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-brand-text sm:text-3xl">{formatPrice(raffle.precio_boleto)}</p>
            </div>
            <div className="bg-brand-surface px-4 py-4 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Disponibles</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-brand-text sm:text-3xl">{availableTickets}<span className="ml-1 text-base font-medium text-brand-muted">/ {raffle.total_boletos}</span></p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-brand-muted">
            <span className="inline-flex items-center gap-2"><Tickets className="h-4 w-4 text-brand-accent" /> {soldTickets} apartados</span>
            {raffle.regalo_incluido && <span className="inline-flex items-center gap-2"><Gift className="h-4 w-4 text-brand-accent" /> Incluye {raffle.regalo_incluido}</span>}
          </div>

          <a href="#boletos" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-text px-6 py-4 text-base font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#3d3427] hover:shadow-[0_12px_24px_rgba(43,34,22,0.18)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 sm:w-auto">
            <Ticket className="h-5 w-5" />
            Consultar números
          </a>
        </div>

        <div className="public-reveal public-reveal-delay-2 relative order-1 mx-auto w-full max-w-[31rem] lg:order-2 lg:max-w-none">
          <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[2.5rem] bg-brand-accent/10 blur-3xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#e9e3d7] p-2 shadow-[0_24px_48px_rgba(69,52,25,0.16)] sm:rounded-[2rem] sm:p-3">
            <div className="relative h-full overflow-hidden rounded-[1.25rem] bg-[#ddd3c2]">
              {imageCount > 0 ? (
                <button ref={triggerRef} type="button" onClick={openImageDialog} className="group block h-full w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white" aria-label={`Ampliar imagen ${currentImageIndex + 1} de ${raffle.nombre}`}>
                  {/* The storage host is configurable per raffle, so a fixed Next Image remote pattern would break valid prize images. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={raffle.fotos[currentImageIndex]}
                    src={raffle.fotos[currentImageIndex]}
                    alt={`${raffle.nombre} — imagen ${currentImageIndex + 1}`}
                    className="public-image-fade h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                    loading="eager"
                    decoding="async"
                  />
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-white/35 bg-[#211b13]/75 px-3 py-2 text-xs font-semibold text-white opacity-100 backdrop-blur-sm transition sm:opacity-0 sm:group-hover:opacity-100"><Maximize2 className="h-3.5 w-3.5" /> Ampliar</span>
                </button>
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm font-medium text-brand-muted">La imagen del premio estará disponible pronto.</div>
              )}

              <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/50 bg-[#211b13]/80 px-3 py-2 text-white backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#ead7aa]">Premio actual</p>
                <p className="mt-0.5 max-w-[15rem] truncate text-sm font-semibold">{raffle.nombre}</p>
              </div>

              {imageCount > 1 && (
                <>
                  <button onClick={onPreviousImage} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[#211b13]/65 text-white backdrop-blur-sm transition hover:bg-[#211b13]/85 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Imagen anterior">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={onNextImage} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[#211b13]/65 text-white backdrop-blur-sm transition hover:bg-[#211b13]/85 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Imagen siguiente">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/30 bg-[#211b13]/65 p-1.5 backdrop-blur-sm">
                    {raffle.fotos.map((_, index) => (
                      <button key={index} onClick={() => onSelectImage(index)} aria-label={`Ver imagen ${index + 1}`} aria-current={index === currentImageIndex} className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${index === currentImageIndex ? "w-5 bg-white" : "w-2.5 bg-white/45 hover:bg-white/80"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto hidden w-full max-w-7xl px-8 lg:block">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-border to-transparent" />
      </div>

      {imageCount > 0 && (
        <dialog
          ref={imageDialogRef}
          className="prize-viewer"
          aria-labelledby="prize-viewer-title"
          onCancel={(event) => {
            event.preventDefault();
            closeImageDialog();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeImageDialog();
          }}
          onClose={() => imageDialogRef.current?.removeAttribute("data-closing")}
        >
          <div className="relative flex h-full min-h-0 flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between gap-4 px-1 pb-3 text-white sm:pb-4">
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c984]">Premio actual</p><h2 id="prize-viewer-title" className="mt-1 truncate text-base font-semibold sm:text-lg">{raffle.nombre}</h2></div>
              <button type="button" onClick={closeImageDialog} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Cerrar imagen ampliada"><X className="h-5 w-5" /></button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.25rem] bg-[#16120d] sm:rounded-[1.5rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={`viewer-${raffle.fotos[currentImageIndex]}`} src={raffle.fotos[currentImageIndex]} alt={`${raffle.nombre} — imagen ampliada ${currentImageIndex + 1}`} className="public-image-fade h-full w-full object-contain" decoding="async" />
              {imageCount > 1 && (
                <>
                  <button type="button" onClick={onPreviousImage} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#211b13]/75 text-white backdrop-blur-sm transition hover:bg-[#211b13] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Imagen anterior"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" onClick={onNextImage} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#211b13]/75 text-white backdrop-blur-sm transition hover:bg-[#211b13] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Imagen siguiente"><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
            </div>
            {imageCount > 1 && <div className="mt-3 flex shrink-0 items-center justify-center gap-2 sm:mt-4">{raffle.fotos.map((_, index) => <button key={`viewer-dot-${index}`} type="button" onClick={() => onSelectImage(index)} aria-label={`Ver imagen ${index + 1}`} aria-current={index === currentImageIndex} className={`h-2.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${index === currentImageIndex ? "w-6 bg-[#f3dd9c]" : "w-2.5 bg-white/35 hover:bg-white/70"}`} />)}</div>}
          </div>
        </dialog>
      )}
    </>
  );
}
