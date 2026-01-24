"use client";

import { IconLoader2, IconRefresh } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { client, orpc } from "@/orpc/orpc-client";

type ReprocessButtonProps = {
  cvId: string;
  status: string;
  onSuccess?: () => void;
};

export function ReprocessButton({
  cvId,
  status,
  onSuccess,
}: ReprocessButtonProps) {
  const queryClient = useQueryClient();

  const reprocessMutation = useMutation({
    mutationFn: (data: { cvId: string }) =>
      client.admin.applications.reprocessCv(data),
    onSuccess: () => {
      toast.success("CV reprocessing started");
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.list.queryOptions({ input: {} })
          .queryKey,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Reprocessing failed: ${error.message}`);
    },
  });

  // Only show for completed or failed CVs
  if (status !== "completed" && status !== "failed") {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={() => reprocessMutation.mutate({ cvId })}
      disabled={reprocessMutation.isPending}
      variant="ghost"
      size="sm"
    >
      {reprocessMutation.isPending ? (
        <IconLoader2 className="size-4 animate-spin" />
      ) : (
        <IconRefresh className="size-4" />
      )}
      Re-analyze
    </Button>
  );
}
