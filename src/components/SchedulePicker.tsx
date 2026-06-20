"use client";

import { CalendarDays, Clock, Sparkles, X } from "lucide-react";

type SchedulePickerProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    description?: string;
    compact?: boolean;
    className?: string;
};

const pad = (value: number) => value.toString().padStart(2, "0");

const preferredTimes = ["18:00", "19:00", "20:00", "21:00", "22:00"];
const hours = Array.from({ length: 24 }, (_, index) => pad(index));
const minutes = Array.from({ length: 60 }, (_, index) => pad(index));

function toDateKey(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeLocalValue(date: Date) {
    return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function atLocalTime(daysFromToday: number, hour: number, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    date.setHours(hour, minute, 0, 0);
    return toDateTimeLocalValue(date);
}

function formatShortDate(date: Date) {
    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
    }).format(date);
}

function formatTimeLabel(time: string) {
    const [hour, minute] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat("es-MX", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function formatPreview(value: string) {
    if (!value) return "Sin horario asignado";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Horario no válido";

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export function SchedulePicker({
    value,
    onChange,
    label = "Fecha y hora de la rifa",
    description = "El anuncio público aparecerá automáticamente con cuenta regresiva.",
    compact = false,
    className = "",
}: SchedulePickerProps) {
    const selectedDateKey = value ? value.slice(0, 10) : "";
    const selectedTime = value && value.length >= 16 ? value.slice(11, 16) : "";
    const selectedHour = selectedTime ? selectedTime.slice(0, 2) : "20";
    const selectedMinute = selectedTime ? selectedTime.slice(3, 5) : "00";
    const days = Array.from({ length: compact ? 4 : 5 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    const updateDate = (dateKey: string) => {
        if (!dateKey) {
            onChange("");
            return;
        }

        onChange(`${dateKey}T${selectedTime || "20:00"}`);
    };

    const updateTime = (time: string) => {
        const dateKey = selectedDateKey || toDateKey(new Date());
        onChange(`${dateKey}T${time}`);
    };

    const updateManualTime = (hour: string, minute: string) => {
        updateTime(`${hour}:${minute}`);
    };

    const setNowPlusMinutes = (addedMinutes: number) => {
        const date = new Date();
        date.setMinutes(date.getMinutes() + addedMinutes, 0, 0);
        onChange(toDateTimeLocalValue(date));
    };

    return (
        <div className={`relative overflow-hidden rounded-[1.75rem] border border-brand-accent/25 bg-gradient-to-br from-brand-accent/10 via-brand-surface to-brand-surface p-4 shadow-sm ${className}`}>
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-brand-accent/20 blur-3xl" />
            <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-accent/30 bg-brand-surface text-brand-accent shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-brand-text">{label}</label>
                            <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">{description}</p>
                        </div>
                    </div>

                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="rounded-full border border-brand-border bg-brand-surface p-2 text-brand-muted transition-colors hover:border-brand-sale/30 hover:bg-brand-sale/10 hover:text-brand-sale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                            aria-label="Limpiar fecha de rifa"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button type="button" onClick={() => onChange(atLocalTime(0, 20))} className="rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-left text-xs font-bold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        Hoy 8:00 PM
                    </button>
                    <button type="button" onClick={() => onChange(atLocalTime(1, 20))} className="rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-left text-xs font-bold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        Mañana 8:00 PM
                    </button>
                    <button type="button" onClick={() => setNowPlusMinutes(10)} className="rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-left text-xs font-bold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        En 10 min
                    </button>
                    <button type="button" onClick={() => setNowPlusMinutes(60)} className="rounded-2xl border border-brand-border bg-brand-surface px-3 py-2 text-left text-xs font-bold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        En 1 hora
                    </button>
                </div>

                <div className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
                    {days.map((date, index) => {
                        const dateKey = toDateKey(date);
                        const selected = selectedDateKey === dateKey;
                        const labelText = index === 0 ? "Hoy" : index === 1 ? "Mañana" : new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(date);

                        return (
                            <button
                                type="button"
                                key={dateKey}
                                onClick={() => updateDate(dateKey)}
                                aria-pressed={selected}
                                className={`rounded-2xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${selected
                                    ? "border-brand-accent bg-brand-accent text-white shadow-sm"
                                    : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent/40 hover:bg-brand-accent/10"
                                    }`}
                            >
                                <span className="block text-xs font-black uppercase tracking-[0.18em] opacity-80">{labelText}</span>
                                <span className="mt-1 block text-lg font-black font-serif">{formatShortDate(date)}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">
                        <Clock className="h-4 w-4" />
                        Hora sugerida
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {preferredTimes.map((time) => {
                            const selected = selectedTime === time;
                            return (
                                <button
                                    type="button"
                                    key={time}
                                    onClick={() => updateTime(time)}
                                    aria-pressed={selected}
                                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${selected
                                        ? "border-brand-text bg-brand-text text-brand-surface"
                                        : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent/50 hover:text-brand-accent"
                                        }`}
                                >
                                    {formatTimeLabel(time)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_92px_92px]">
                    <div className="space-y-1.5">
                        <span className="text-xs font-medium text-brand-muted">Otro día</span>
                        <input
                            type="date"
                            value={selectedDateKey}
                            onChange={(event) => updateDate(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-brand-border bg-brand-surface px-3 text-sm font-bold text-brand-text outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-xs font-medium text-brand-muted">Hora</span>
                        <select
                            value={selectedHour}
                            onChange={(event) => updateManualTime(event.target.value, selectedMinute)}
                            className="h-11 w-full rounded-2xl border border-brand-border bg-brand-surface px-3 text-sm font-bold text-brand-text outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                        >
                            {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-xs font-medium text-brand-muted">Min</span>
                        <select
                            value={selectedMinute}
                            onChange={(event) => updateManualTime(selectedHour, event.target.value)}
                            className="h-11 w-full rounded-2xl border border-brand-border bg-brand-surface px-3 text-sm font-bold text-brand-text outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                        >
                            {minutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-brand-accent/20 bg-brand-surface/80 px-4 py-3 text-brand-text shadow-inner">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-accent">Vista previa</p>
                        <p className="mt-0.5 text-sm font-bold capitalize">{formatPreview(value)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
