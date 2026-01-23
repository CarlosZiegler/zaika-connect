import { isAdminEmail } from "@/lib/auth/admin-check";

import { orpc, protectedProcedure } from "../../orpc-server";

export const adminCheckRouter = orpc.router({
  isAdmin: protectedProcedure.handler(async ({ context }) => {
    return {
      isAdmin: isAdminEmail(context.session?.user?.email),
    };
  }),
});
