import { STATUS_LABELS, STATUS_TONES } from "@/lib/orderLogic";

const toneClasses: Record<string, { bg: string; text: string; dot: string }> = {
  amber: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  emerald: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  sky: { bg: "bg-sky-50 border-sky-200", text: "text-sky-800", dot: "bg-sky-500" },
  violet: { bg: "bg-violet-50 border-violet-200", text: "text-violet-800", dot: "bg-violet-500" },
  indigo: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-800", dot: "bg-indigo-500" },
  rose: { bg: "bg-rose-50 border-rose-200", text: "text-rose-800", dot: "bg-rose-500" },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export default function StatusBadge({
  status,
  size = "sm",
  showDot = true,
}: StatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? "amber";
  const classes = toneClasses[tone] ?? toneClasses.amber;
  const label = STATUS_LABELS[status] ?? status;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${classes.bg} ${classes.text} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />
      )}
      {label}
    </span>
  );
}
