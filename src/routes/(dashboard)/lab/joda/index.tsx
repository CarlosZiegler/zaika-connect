import { createFileRoute } from "@tanstack/react-router";

import { JodaPage } from "@/features/lab/joda/joda.page";

export const Route = createFileRoute("/(dashboard)/lab/joda/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <JodaPage />;
}
