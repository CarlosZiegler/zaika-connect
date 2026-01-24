import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";

export const Route = createFileRoute("/(dashboard)/overview/")({
  validateSearch: z.object({
    period: z.enum(["7d", "30d", "month", "3months"]).optional(),
  }),
  beforeLoad: async () => {
    const result = await getUserWithAdmin();
    if (!result.isAdmin) {
      throw redirect({ to: "/settings" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardPage />;
}
