import { cn } from "@/lib/utils";

type AIScoreBadgeProps = {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "default" | "minimal" | "ring";
};

/**
 * Returns subtle indicator colors based on score.
 * Uses neutral backgrounds with only the indicator dot showing quality.
 */
function getIndicatorColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-sky-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-400";
}

function AIScoreBadge({
  score,
  size = "md",
  showLabel = false,
  variant = "default",
}: AIScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground text-xs">
        <span className="size-1.5 rounded-full bg-muted-foreground/30" />
        N/A
      </span>
    );
  }

  const indicatorColor = getIndicatorColor(score);

  const sizeConfig = {
    sm: {
      wrapper: "px-2 py-0.5 text-xs gap-1.5",
      dot: "size-1.5",
      ring: "size-7",
      ringStroke: 2.5,
      ringText: "text-[10px]",
    },
    md: {
      wrapper: "px-2.5 py-1 text-sm gap-1.5",
      dot: "size-2",
      ring: "size-9",
      ringStroke: 2.5,
      ringText: "text-xs",
    },
    lg: {
      wrapper: "px-3 py-1.5 text-base gap-2",
      dot: "size-2.5",
      ring: "size-11",
      ringStroke: 3,
      ringText: "text-sm",
    },
  }[size];

  // Minimal variant - clean number with indicator dot
  if (variant === "minimal") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
        <span className={cn("rounded-full", indicatorColor, sizeConfig.dot)} />
        {score}
      </span>
    );
  }

  // Ring variant - circular progress
  if (variant === "ring") {
    const circumference = 2 * Math.PI * 10;
    const progress = (score / 100) * circumference;
    const strokeColor =
      score >= 80
        ? "stroke-emerald-500"
        : score >= 60
          ? "stroke-sky-500"
          : score >= 40
            ? "stroke-amber-500"
            : "stroke-rose-400";

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className={sizeConfig.ring} viewBox="0 0 24 24">
          <circle
            className="stroke-muted"
            cx="12"
            cy="12"
            fill="none"
            r="10"
            strokeWidth={sizeConfig.ringStroke}
          />
          <circle
            className={cn("transition-all duration-500", strokeColor)}
            cx="12"
            cy="12"
            fill="none"
            r="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            strokeWidth={sizeConfig.ringStroke}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <span
          className={cn(
            "absolute font-semibold tabular-nums text-foreground",
            sizeConfig.ringText
          )}
        >
          {score}
        </span>
      </div>
    );
  }

  // Default - neutral pill with colored indicator dot
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted font-semibold tabular-nums text-foreground",
        sizeConfig.wrapper
      )}
    >
      {showLabel ? (
        <span className="font-normal text-muted-foreground">Score:</span>
      ) : (
        <span className={cn("rounded-full", indicatorColor, sizeConfig.dot)} />
      )}
      {score}
    </span>
  );
}

export { AIScoreBadge };
export type { AIScoreBadgeProps };
