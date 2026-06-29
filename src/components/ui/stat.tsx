import { cn } from "#/lib/utils";

type DeltaTone = "positive" | "negative" | "danger" | "neutral";

interface StatProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: DeltaTone;
  className?: string;
}

const DELTA_COLOR: Record<DeltaTone, string> = {
  positive: "var(--green-400)",
  negative: "var(--red-400)",
  danger: "var(--red-400)",
  neutral: "var(--text-muted)",
};

export function Stat({ label, value, unit, delta, deltaTone = "positive", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-[var(--font-mono)] text-[30px] leading-none text-[var(--text-primary)]">
          {value}
        </span>
        {unit && <span className="text-[13px] text-[var(--text-muted)]">{unit}</span>}
      </span>
      {delta && (
        <span
          data-tone={deltaTone}
          className="text-[11px]"
          style={{ color: DELTA_COLOR[deltaTone] }}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
