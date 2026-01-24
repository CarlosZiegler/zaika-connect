import { cn } from "@/lib/utils";

type AIScoreBadgeProps = {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "default" | "minimal" | "ring";
};

/**
 * Returns refined color classes based on score thresholds.
 * Uses muted, sophisticated colors that complement a professional UI.
 */
function getScoreStyles(score: number): {
  bg: string;
  text: string;
  ring: string;
  gradient: string;
} {
  // Excellent: 80-100 - Soft teal/cyan
  if (score >= 80) {
    return {
      bg: "bg-teal-50 dark:bg-teal-950/40",
      text: "text-teal-700 dark:text-teal-300",
      ring: "ring-teal-200 dark:ring-teal-800",
      gradient: "from-teal-500 to-cyan-500",
    };
  }
  // Good: 60-79 - Soft blue/indigo
  if (score >= 60) {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
      ring: "ring-blue-200 dark:ring-blue-800",
      gradient: "from-blue-500 to-indigo-500",
    };
  }
  // Average: 40-59 - Soft amber/orange
  if (score >= 40) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      ring: "ring-amber-200 dark:ring-amber-800",
      gradient: "from-amber-500 to-orange-500",
    };
  }
  // Below average: 0-39 - Soft rose/red
  return {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-200 dark:ring-rose-800",
    gradient: "from-rose-500 to-red-500",
  };
}

function AIScoreBadge({
  score,
  size = "md",
  showLabel = false,
  variant = "default",
}: AIScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 font-medium text-muted-foreground text-xs ring-1 ring-border/50">
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        N/A
      </span>
    );
  }

  const styles = getScoreStyles(score);

  const sizeClasses = {
    sm: {
      wrapper: "px-2 py-0.5 text-xs gap-1",
      dot: "size-1.5",
      ring: "size-6",
      ringStroke: 3,
    },
    md: {
      wrapper: "px-2.5 py-1 text-sm gap-1.5",
      dot: "size-2",
      ring: "size-8",
      ringStroke: 3,
    },
    lg: {
      wrapper: "px-3 py-1.5 text-base gap-2",
      dot: "size-2.5",
      ring: "size-10",
      ringStroke: 4,
    },
  };

  const sizeConfig = sizeClasses[size];

  // Minimal variant - just the number with a subtle indicator dot
  if (variant === "minimal") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold tabular-nums",
          styles.text,
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base"
        )}
      >
        <span
          className={cn(
            "rounded-full bg-gradient-to-br",
            styles.gradient,
            sizeConfig.dot
          )}
        />
        {score}
      </span>
    );
  }

  // Ring variant - circular progress indicator
  if (variant === "ring") {
    const circumference = 2 * Math.PI * 10;
    const progress = (score / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className={sizeConfig.ring} viewBox="0 0 24 24">
          {/* Background ring */}
          <circle
            className="stroke-muted"
            cx="12"
            cy="12"
            fill="none"
            r="10"
            strokeWidth={sizeConfig.ringStroke}
          />
          {/* Progress ring */}
          <circle
            className={cn("transition-all duration-500", styles.text)}
            cx="12"
            cy="12"
            fill="none"
            r="10"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            strokeWidth={sizeConfig.ringStroke}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        </svg>
        <span
          className={cn(
            "absolute font-semibold tabular-nums",
            styles.text,
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          {score}
        </span>
      </div>
    );
  }

  // Default variant - refined pill badge
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tabular-nums ring-1",
        styles.bg,
        styles.text,
        styles.ring,
        sizeConfig.wrapper
      )}
    >
      {showLabel ? (
        <span className="font-normal opacity-70">Score:</span>
      ) : (
        <span
          className={cn(
            "rounded-full bg-gradient-to-br",
            styles.gradient,
            sizeConfig.dot
          )}
        />
      )}
      {score}
    </span>
  );
}

export { AIScoreBadge };
export type { AIScoreBadgeProps };
