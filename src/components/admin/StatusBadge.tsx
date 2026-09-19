import { STATUS_LABELS, STATUS_TONES } from "@/lib/orderLogic";

const toneClasses: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  amber: {
    bg: "bg-amber-50/90 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/50",
    dot: "bg-amber-500",
  },
  emerald: {
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/50",
    dot: "bg-emerald-500",
  },
  sky: {
    bg: "bg-sky-50/90 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200/80 dark:border-sky-800/50",
    dot: "bg-sky-500",
  },
  violet: {
    bg: "bg-violet-50/90 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200/80 dark:border-violet-800/50",
    dot: "bg-violet-500",
  },
  indigo: {
    bg: "bg-indigo-50/90 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200/80 dark:border-indigo-800/50",
    dot: "bg-indigo-500",
  },
  rose: {
    bg: "bg-rose-50/90 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/50",
    dot: "bg-rose-500",
  },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  pulse?: boolean;
}

export default function StatusBadge({
  status,
  size = "sm",
  showDot = true,
  pulse = false,
}: StatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? "amber";
  const classes = toneClasses[tone] ?? toneClasses.amber;
  const label = STATUS_LABELS[status] ?? status;

  const sizeClasses = {
    sm: "text-[11px] px-2.5 py-0.5 font-medium",
    md: "text-xs px-3 py-1 font-semibold",
    lg: "text-sm px-3.5 py-1.5 font-semibold",
  };

  const isPendingOrUrgent = status === "PENDING" || pulse;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs backdrop-blur-xs transition-all tracking-wide ${classes.bg} ${classes.text} ${classes.border} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {isPendingOrUrgent && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${classes.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${classes.dot}`} />
        </span>
      )}
      {label}
    </span>
  );
}
