const pad = (value: number) => value.toString().padStart(2, "0");

export type CountdownDetails = {
    isStarted: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    scheduledLabel: string;
    remainingMs: number;
};

export function isoToDateTimeLocal(value?: string | null): string {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

export function dateTimeLocalToIso(value: string): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}

export function formatScheduledDate(value?: string | null): string {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function getCountdownDetails(value?: string | null, nowMs = Date.now()): CountdownDetails | null {
    if (!value) return null;

    const date = new Date(value);
    const targetMs = date.getTime();
    if (Number.isNaN(targetMs)) return null;

    const remainingMs = targetMs - nowMs;
    const scheduledLabel = formatScheduledDate(value);

    if (remainingMs <= 0) {
        return {
            isStarted: true,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            formatted: "00:00",
            scheduledLabel,
            remainingMs,
        };
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = days > 0
        ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
        : hours > 0
            ? `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
            : `${pad(minutes)}:${pad(seconds)}`;

    return {
        isStarted: false,
        days,
        hours,
        minutes,
        seconds,
        formatted,
        scheduledLabel,
        remainingMs,
    };
}
