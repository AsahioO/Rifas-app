import { PartyPopper, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type WheelSlice = {
  boleto: number;
  nombre: string;
};

type WheelResult = {
  boleto: number;
  nombre: string;
} | null;

type RaffleWheelProps = {
  slices: WheelSlice[];
  rotation: number;
  isResetting?: boolean;
  result?: WheelResult;
  winner?: WheelResult;
  currentAttempt?: number;
  totalAttempts?: number;
  isDrawing?: boolean;
  showNames?: boolean;
  centerLabel?: string;
  className?: string;
};

const WHEEL_COLORS = [
  "#063d31",
  "#0d5c47",
  "#17150f",
  "#0f766e",
  "#8a6f3f",
  "#123f35",
  "#155e75",
  "#2a261b",
];

const RIVETS = Array.from({ length: 16 }, (_, i) => i * 22.5);

function getCoordinatesForPercent(percent: number) {
  const x = Math.cos(2 * Math.PI * percent) * 50;
  const y = Math.sin(2 * Math.PI * percent) * 50;
  return [x + 50, y + 50];
}

function getRingPoint(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function getFontSize(total: number) {
  if (total < 8) return 4.2;
  if (total < 16) return 3.2;
  if (total < 28) return 2.4;
  if (total < 44) return 1.9;
  return 1.5;
}

function getNameFontSize(total: number) {
  if (total < 8) return 3.2;
  if (total < 16) return 2.3;
  if (total < 28) return 1.7;
  if (total < 44) return 1.3;
  return 1.05;
}

function truncateName(nombre: string, total: number): string {
  const cleanName = nombre.trim() || "Anónimo";
  const maxLen = total > 50 ? 6 : total > 40 ? 8 : total > 30 ? 10 : total > 20 ? 12 : total > 12 ? 16 : 20;
  if (cleanName.length <= maxLen) return cleanName;
  return cleanName.slice(0, maxLen - 1) + "…";
}

function AttemptText({ currentAttempt, totalAttempts }: Pick<RaffleWheelProps, "currentAttempt" | "totalAttempts">) {
  if (!currentAttempt || !totalAttempts) return null;

  return (
    <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-[#8a2f2f] sm:text-sm">
      Intento {currentAttempt} de {totalAttempts}
    </p>
  );
}

export function RaffleWheel({
  slices,
  rotation,
  isResetting = false,
  result = null,
  winner = null,
  currentAttempt,
  totalAttempts,
  isDrawing = false,
  showNames = true,
  centerLabel = "RIFA",
  className,
}: RaffleWheelProps) {
  const total = slices.length;
  const hasSingleSlice = total === 1;
  const ariaLabel = winner
    ? `Ganador del sorteo: boleto ${winner.boleto}, ${winner.nombre}`
    : result
      ? `Boleto eliminado: ${result.boleto}, ${result.nombre}`
      : `Ruleta del sorteo con ${total} boletos en juego`;

  return (
    <div
      className={cn("relative aspect-square text-[#fbf6ea]", className)}
      role="img"
      aria-label={ariaLabel}
      aria-live={result || winner ? "polite" : undefined}
      aria-atomic={result || winner ? "true" : undefined}
    >
      <div className="absolute -inset-[7%] rounded-full bg-[#15100b] shadow-[0_30px_80px_rgba(0,0,0,0.28)]" />
      <div className="absolute -inset-[4.5%] rounded-full border-[10px] border-[#b99a61] bg-[#21170f] shadow-[inset_0_0_0_2px_rgba(255,246,226,0.22)] sm:border-[14px]" />
      <div className="absolute -inset-[1.5%] rounded-full border-[3px] border-[#f1e2bf] bg-[#241b12] shadow-[inset_0_0_0_6px_rgba(36,27,18,0.72)]" />

      <svg viewBox="0 0 100 100" className="absolute -inset-[4.5%] z-20 h-[109%] w-[109%]" aria-hidden="true">
        {RIVETS.map((angle) => {
          const point = getRingPoint(angle, 47.8);
          return (
            <circle
              key={angle}
              cx={point.x}
              cy={point.y}
              r="1.15"
              fill="#d6bd81"
              stroke="#2b2116"
              strokeWidth="0.35"
            />
          );
        })}
      </svg>

      {!winner && (
        <div className="absolute -top-[12%] left-1/2 z-40 w-[17%] -translate-x-1/2 drop-shadow-[0_8px_10px_rgba(0,0,0,0.32)]">
          <svg viewBox="0 0 64 78" className="h-auto w-full" aria-hidden="true">
            <path d="M32 74 9 22c-2-5 2-10 7-10h32c5 0 9 5 7 10L32 74Z" fill="#c5a15f" stroke="#22180f" strokeWidth="5" strokeLinejoin="round" />
            <path d="M20 16h24v11H20z" fill="#f2dfad" stroke="#22180f" strokeWidth="4" />
            <circle cx="32" cy="21" r="6" fill="#24180f" />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-[4.5%] overflow-hidden rounded-full border-[4px] border-[#18110b] bg-[#0b3329] shadow-[inset_0_0_0_4px_rgba(240,221,176,0.45),inset_0_0_30px_rgba(0,0,0,0.35)] sm:border-[6px]",
          isResetting ? "duration-0" : "transition-transform duration-[5000ms] ease-[cubic-bezier(0.19,0.72,0.18,1)]",
          isDrawing && "shadow-[inset_0_0_0_4px_rgba(240,221,176,0.45),inset_0_0_30px_rgba(0,0,0,0.35),0_0_0_6px_rgba(197,161,95,0.2)]"
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
              {hasSingleSlice ? (
                <>
                  <circle cx="50" cy="50" r="50" fill={WHEEL_COLORS[0]} />
                  <circle cx="50" cy="50" r="37" fill="none" stroke="#f2dfad" strokeWidth="0.55" opacity="0.55" />
                  <text x="50" y="44" fill="#fff8e8" fontSize="4.5" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                    {slices[0].boleto}
                  </text>
                  <text x="50" y="56" fill="#fff8e8" fontSize="3" fontWeight="700" textAnchor="middle" dominantBaseline="middle" opacity="0.85">
                    {truncateName(slices[0].nombre, total)}
                  </text>
                </>
              ) : (
                slices.map((slice, index) => {
                  const startPercent = index / total;
                  const endPercent = (index + 1) / total;
                  const [startX, startY] = getCoordinatesForPercent(startPercent);
                  const [endX, endY] = getCoordinatesForPercent(endPercent);
                  const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                  const pathData = `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                  const midPercent = (startPercent + endPercent) / 2;
                  const angleDeg = midPercent * 360;
                  const numFontSize = getFontSize(total);
                  const nameFontSize = getNameFontSize(total);
                  const displayName = truncateName(slice.nombre, total);
                  const showNameLine = showNames && total <= 60 && nameFontSize >= 1;

                  return (
                    <g key={`${slice.boleto}-${index}`}>
                      <path d={pathData} fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} stroke="#0c0a06" strokeWidth="0.45" />
                      <path d={pathData} fill="none" stroke="#f2dfad" strokeWidth="0.12" opacity="0.7" />
                      <text
                        x="50"
                        y="50"
                        fill="#fff8e8"
                        textAnchor="end"
                        dominantBaseline="middle"
                        transform={`rotate(${angleDeg}, 50, 50) translate(45.5, 0)`}
                      >
                        <tspan
                          x="50"
                          dy={showNameLine ? `-${numFontSize * 0.55}em` : "0"}
                          fontSize={numFontSize}
                          fontWeight="900"
                          letterSpacing="0.08em"
                        >
                          {slice.boleto}
                        </tspan>
                        {showNameLine && (
                          <tspan
                            x="50"
                            dy={`${numFontSize * 1.2}em`}
                            fontSize={nameFontSize}
                            fontWeight="700"
                            letterSpacing="0.04em"
                            opacity="0.85"
                          >
                            {displayName}
                          </tspan>
                        )}
                      </text>
                    </g>
                  );
                })
              )}

          <circle cx="50" cy="50" r="45.2" fill="none" stroke="#f2dfad" strokeWidth="0.55" opacity="0.75" />
          <circle cx="50" cy="50" r="31.5" fill="none" stroke="#0c0a06" strokeWidth="0.55" opacity="0.45" />
          <circle cx="50" cy="50" r="18.5" fill="none" stroke="#f2dfad" strokeWidth="0.35" opacity="0.55" />
        </svg>
      </div>

      {!result && !winner && (
        <div className="absolute left-1/2 top-1/2 z-30 flex h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#b99a61] bg-[#f7ecd4] text-[9px] font-black uppercase tracking-[0.18em] text-[#281c12] shadow-[0_8px_18px_rgba(0,0,0,0.32),inset_0_0_0_3px_rgba(255,255,255,0.6)] sm:text-xs">
          {centerLabel}
        </div>
      )}

      {result && !winner && (
        <div className="absolute inset-[8%] z-50 flex items-center justify-center rounded-full border-[5px] border-[#8a2f2f] bg-[#fbf6ea]/95 p-6 text-center text-[#21170f] shadow-[0_18px_45px_rgba(0,0,0,0.3)] animate-in zoom-in duration-300">
          <div className="max-w-[80%]">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8a2f2f] sm:text-xs">Eliminado</p>
            <p className="mt-2 font-serif text-4xl font-black tabular-nums text-[#21170f] sm:text-6xl">{result.boleto}</p>
            <p className="mt-2 truncate text-sm font-bold text-[#5f5141] sm:text-xl" title={result.nombre}>{result.nombre}</p>
            <AttemptText currentAttempt={currentAttempt} totalAttempts={totalAttempts} />
          </div>
        </div>
      )}

      {winner && (
        <div className="absolute inset-[6%] z-50 flex flex-col items-center justify-center rounded-full border-[6px] border-[#b99a61] bg-[#fbf6ea]/95 p-6 text-center text-[#21170f] shadow-[0_20px_55px_rgba(0,0,0,0.34)] animate-in zoom-in duration-700">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#b99a61] bg-[#21170f] text-[#f2dfad] shadow-[inset_0_0_0_2px_rgba(242,223,173,0.2)] sm:h-16 sm:w-16">
            <PartyPopper className="h-8 w-8" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.36em] text-[#8a6f3f] sm:text-xs">Ganador</p>
          <p className="mt-2 font-serif text-5xl font-black tabular-nums text-[#21170f] sm:text-7xl">{winner.boleto}</p>
          <p className="mt-3 flex max-w-[82%] items-center justify-center gap-2 truncate text-base font-bold text-[#4d4234] sm:text-2xl" title={winner.nombre}>
            <Trophy className="h-5 w-5 shrink-0 text-[#8a6f3f]" />
            <span className="truncate">{winner.nombre}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export type { RaffleWheelProps };
