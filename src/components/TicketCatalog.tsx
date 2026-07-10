"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Check, Filter, Ticket, X } from "lucide-react";
import type { Participant } from "@/lib/store";

type TicketCatalogProps = {
  totalTickets: number;
  participants: Participant[];
};

type Filter = "all" | "available" | "taken";
const INITIAL_VISIBLE_TICKETS = 100;
const MORE_TICKETS = 100;

export const TicketCatalog = memo(function TicketCatalog({ totalTickets, participants }: TicketCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_TICKETS);

  const ticketOwners = useMemo(() => {
    const owners = new Map<number, string>();
    participants.forEach((participant) => {
      participant.boletos.forEach((boleto) => {
        if (boleto >= 1 && boleto <= totalTickets) owners.set(boleto, participant.nombre);
      });
    });
    return owners;
  }, [participants, totalTickets]);

  const tickets = useMemo(() => Array.from({ length: totalTickets }, (_, index) => {
    const boleto = index + 1;
    const owner = ticketOwners.get(boleto);
    return { boleto, owner, isTaken: owner !== undefined };
  }), [ticketOwners, totalTickets]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (filter === "available") return !ticket.isTaken;
    if (filter === "taken") return ticket.isTaken;
    return true;
  }), [filter, tickets]);

  useEffect(() => setVisibleCount(INITIAL_VISIBLE_TICKETS), [filter, totalTickets]);

  const availableTickets = totalTickets - ticketOwners.size;
  const visibleTickets = filteredTickets.slice(0, visibleCount);
  const hasMoreTickets = visibleTickets.length < filteredTickets.length;

  const changeFilter = (nextFilter: Filter) => {
    setFilter(nextFilter);
    setVisibleCount(INITIAL_VISIBLE_TICKETS);
  };

  return (
    <section id="boletos" className="relative scroll-mt-20 bg-[#eee8dc] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,rgba(200,169,110,0.16),transparent_25%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-[#d9d0c0] pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">Catálogo de la rifa</p>
            <h2 className="mt-3 max-w-2xl text-balance font-serif text-4xl font-semibold tracking-[-0.055em] text-brand-text sm:text-5xl">Consulta los números disponibles</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-brand-muted">Elige el número que prefieras y revisa su disponibilidad antes de apartarlo por tu canal habitual.</p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#d8cdb9] bg-[#d8cdb9] shadow-[0_12px_28px_rgba(69,52,25,0.06)]">
            <div className="bg-[#fffdf8] px-5 py-3.5 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-muted">Libres</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-brand-text">{availableTickets}</p></div>
            <div className="bg-[#fffdf8] px-5 py-3.5 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-muted">Apartados</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-brand-text">{ticketOwners.size}</p></div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full rounded-xl border border-[#d8cdb9] bg-[#f8f4eb] p-1 sm:w-auto" aria-label="Filtrar boletos">
            <Filter className="ml-2 hidden h-4 w-4 self-center text-brand-muted sm:block" />
            {([
              ["all", "Todos"],
              ["available", "Disponibles"],
              ["taken", "Apartados"],
            ] as const).map(([value, label]) => (
              <button key={value} onClick={() => changeFilter(value)} aria-pressed={filter === value} className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:flex-none ${filter === value ? "bg-brand-text text-white shadow-sm" : "text-brand-muted hover:bg-white hover:text-brand-text"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-brand-muted">Mostrando <span className="font-semibold text-brand-text">{visibleTickets.length}</span> de {filteredTickets.length} boletos</p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#ded5c5] bg-[#fffdf8] p-3 shadow-[0_18px_42px_rgba(69,52,25,0.08)] sm:p-5">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 sm:gap-3 md:grid-cols-10 lg:grid-cols-12">
            {visibleTickets.map(({ boleto, owner, isTaken }) => (
              <div key={boleto} title={isTaken ? `Boleto ${boleto} apartado por ${owner || "Anónimo"}` : `Boleto ${boleto} disponible`} aria-label={isTaken ? `Boleto ${boleto} apartado` : `Boleto ${boleto} disponible`} className={`group relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl border text-center transition duration-200 ${isTaken ? "border-[#e4ddd1] bg-[#f2eee6] text-[#aaa093]" : "border-[#dbc18b] bg-[#fffcf5] text-brand-text shadow-[0_3px_8px_rgba(69,52,25,0.06)] hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-[0_9px_18px_rgba(160,125,53,0.14)]"}`}>
                <span className="font-mono text-sm font-semibold tabular-nums sm:text-base">{boleto}</span>
                <span className={`mt-0.5 flex h-3.5 items-center justify-center ${isTaken ? "text-brand-muted" : "text-brand-accent"}`}>{isTaken ? <X className="h-3 w-3" aria-hidden="true" /> : <Check className="h-3 w-3" aria-hidden="true" />}</span>
                {isTaken && <span className="sr-only">Apartado por {owner || "Anónimo"}</span>}
              </div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center"><Ticket className="h-7 w-7 text-brand-accent" /><p className="mt-3 font-semibold text-brand-text">No hay boletos en esta categoría.</p><button onClick={() => changeFilter("all")} className="mt-2 text-sm font-semibold text-brand-accent underline-offset-4 hover:underline">Ver todos los boletos</button></div>
          )}

          {hasMoreTickets && (
            <div className="mt-6 flex justify-center border-t border-[#eee7da] pt-5"><button onClick={() => setVisibleCount((current) => current + MORE_TICKETS)} className="rounded-lg border border-brand-border bg-[#f8f4eb] px-5 py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">Mostrar 100 boletos más</button></div>
          )}
        </div>
      </div>
    </section>
  );
});
