"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconLoader2,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    Icon: IconClock,
  },
  processing: {
    label: "Processing",
    variant: "default" as const,
    Icon: IconLoader2,
  },
  completed: {
    label: "Analyzed",
    variant: "success" as const,
    Icon: IconCheck,
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    Icon: IconAlertCircle,
  },
} as const;

type ProcessingStatus = keyof typeof statusConfig;

type ProcessingStatusBadgeProps = {
  status: string;
  error?: string | null;
  className?: string;
};

export function ProcessingStatusBadge({
  status,
  error,
  className,
}: ProcessingStatusBadgeProps) {
  const { t } = useTranslation();
  const config =
    statusConfig[status as ProcessingStatus] ?? statusConfig.pending;
  const { Icon, label, variant } = config;
  const errorLabel =
    typeof error === "string" && error.startsWith("ORPC_ERROR_") ? t(error) : error;

  return (
    <Badge
      variant={variant}
      className={cn("gap-1", className)}
      title={errorLabel ?? undefined}
    >
      <Icon
        className={cn("size-3", status === "processing" && "animate-spin")}
      />
      {label}
    </Badge>
  );
}
