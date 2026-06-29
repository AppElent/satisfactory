import { cn } from "#/lib/utils";

type ProgressTone = "accent" | "success" | "warning" | "danger";

interface ProgressProps {
  /** 0-100 */
  value: number;
  tone?: ProgressTone;
  glow?: boolean;
  className?: string;
}

const FILL: Record<ProgressTone, string> = {
  accent: "linear-gradient(180deg,var(--orange-400),var(--orange-500))",
  success: "linear-gradient(180deg,var(--green-400),var(--green-500))",
  warning: "linear-gradient(180deg,var(--yellow-400),var(--yellow-500))",
  danger: "linear-gradient(180deg,var(--red-400),var(--red-500))",
};

const GLOW: Record<ProgressTone, string> = {
  accent: "var(--glow-accent-strong)",
  success: "var(--glow-success)",
  warning: "none",
  danger: "var(--glow-danger)",
};

export function Progress({ value, tone = "accent", glow = false, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-[7px] overflow-hidden rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)]",
        className,
      )}
    >
      <div
        data-progress-indicator
        className="h-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-standard)]"
        style={{ width: `${pct}%`, background: FILL[tone], boxShadow: glow ? GLOW[tone] : undefined }}
      />
    </div>
  );
}
