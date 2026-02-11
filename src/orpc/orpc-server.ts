import { ORPCError, onError, os } from "@orpc/server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { type RlsSession, withRls } from "@/lib/db/secure-client";
import { log } from "@/utils/log";

import { toUserSafeORPCError } from "./error-normalization";

export const createORPCContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers,
  });

  return {
    db,
    rls: async <T>(fn: (tx: typeof db) => Promise<T>) => {
      if (!session?.user) {
        throw new ORPCError("UNAUTHORIZED");
      }
      return await withRls(session as RlsSession, fn);
    },
    session,
    auth,
    headers,
  };
};

const timingMiddleware = os.middleware(async ({ next, path }) => {
  const startedAt = Date.now();

  try {
    return await next();
  } finally {
    log.debug(
      {
        durationMs: Date.now() - startedAt,
        procedure: path.join("."),
      },
      "oRPC procedure finished"
    );
  }
});

export type Context = Awaited<ReturnType<typeof createORPCContext>>;
export const orpc = os.$context<Context>();

const requireAuth = orpc.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return await next({
    context: {
      session: context.session,
    },
  });
});
export const publicProcedure = orpc
  .$context<Context>()
  .use(
    onError((error, options) => {
      throw toUserSafeORPCError(error, {
        procedure: options.path.join("."),
        headers: options.context.headers,
      });
    })
  )
  .use(timingMiddleware);

export const protectedProcedure = publicProcedure.use(requireAuth);

const withRlsMiddleware = orpc.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return await withRls(context.session as RlsSession, async (rlsDb) => {
    return await next({
      context: {
        db: rlsDb,
      },
    });
  });
});

/**
 * Use this for routes that query tables protected by Postgres RLS policies.
 * It runs the handler inside a transaction, sets `request.user_id/org_id`,
 * and provides an RLS-scoped `db` for the handler.
 */
export const protectedRlsProcedure = protectedProcedure.use(withRlsMiddleware);
