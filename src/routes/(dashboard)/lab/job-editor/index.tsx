import { createFileRoute, redirect } from "@tanstack/react-router";

import { JobEditorPage } from "@/features/lab/job-editor/job-editor.page";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";

export const Route = createFileRoute("/(dashboard)/lab/job-editor/")({
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
  return <JobEditorPage />;
}
