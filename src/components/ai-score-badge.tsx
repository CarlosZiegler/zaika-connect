import { cn } from "@/lib/utils";

type AIScoreBadgeProps = {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

function getScoreColor(score: number): string {
  if (score >= 70) {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  }
  if (score >= 50) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function AIScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: AIScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        N/A
      </span>
    );
  }

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold",
        getScoreColor(score),
        sizeClasses[size]
      )}
    >
      {showLabel ? "Score: " : ""}
      {score}
    </span>
  );
}

export { AIScoreBadge };
export type { AIScoreBadgeProps };
