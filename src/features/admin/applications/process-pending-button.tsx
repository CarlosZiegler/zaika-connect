"use client";

import { IconLoader2, IconPlayerPlay } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { client, orpc } from "@/orpc/orpc-client";

export function ProcessPendingButton() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    ...orpc.admin.applications.getPendingCount.queryOptions({ input: {} }),
    refetchInterval: 2000,
  });

  const processMutation = useMutation({
    mutationFn: (data: { limit: number }) =>
      client.admin.applications.processPending(data),
    onSuccess: (data) => {
      if (data.processed > 0) {
        toast.success(`Processed ${data.processed} CVs`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} CVs failed to process`);
      }
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.getPendingCount.queryOptions({
          input: {},
        }).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.list.queryOptions.baseKey,
      });
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });

  const count = pendingQuery.data?.count ?? 0;
  const isProcessing = processMutation.isPending;

  if (count === 0 && !isProcessing) {
    return null;
  }

  return (
    <Button
      onClick={() => processMutation.mutate({ limit: 10 })}
      disabled={count === 0 || isProcessing}
      variant="outline"
      size="sm"
      type="button"
    >
      {isProcessing ? (
        <>
          <IconLoader2 className="size-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <IconPlayerPlay className="size-4" />
          Process Pending ({count})
        </>
      )}
    </Button>
  );
}
