import { createFileRoute, redirect } from "@tanstack/react-router";

import { JobDetailPage } from "@/features/admin/job-detail/job-detail.page";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";

export const Route = createFileRoute("/(dashboard)/admin/jobs/$jobId")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { session, isAdmin } = await getUserWithAdmin();
    if (!isAdmin) {
      throw redirect({ to: "/overview" });
    }
    return { session };
  },
});

function RouteComponent() {
  return <JobDetailPage />;
}
