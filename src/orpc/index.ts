import type { RouterClient } from "@orpc/server";

import { orpc } from "./orpc-server";
import { adminApplicationsRouter } from "./routes/admin/applications";
import { adminCheckRouter } from "./routes/admin/check";
import { adminJobsRouter } from "./routes/admin/jobs";
import { applicationsRouter } from "./routes/applications";
import { dashboardRouter } from "./routes/dashboard";
import { jobsRouter } from "./routes/jobs";
import { organizationRouter } from "./routes/organization";
import { profileRouter } from "./routes/profile";
import { storageRouter } from "./routes/storage";

export const router = orpc.router({
  profile: profileRouter,
  organization: organizationRouter,
  dashboard: dashboardRouter,
  storage: storageRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  admin: orpc.router({
    check: adminCheckRouter,
    jobs: adminJobsRouter,
    applications: adminApplicationsRouter,
  }),
});

export type AppRouter = typeof router;
export type AppRouterClient = RouterClient<typeof router>;
