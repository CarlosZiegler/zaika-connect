/// <reference types="vite/client" />
/** biome-ignore-all lint/style/noHeadElement: needed to author <head> content */

import type { QueryClient } from "@tanstack/react-query";
import type * as React from "react";

import { aiDevtoolsPlugin } from "@tanstack/react-ai-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { I18nextProvider } from "react-i18next";

import type { AuthSession } from "@/lib/auth/auth-client";
import type { orpc } from "@/orpc/orpc-client";

import appCss from "@/app.css?url";
import { DefaultCatchBoundary } from "@/components/error-boundary";
import { NotFound } from "@/components/not-found";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authQueryOptions } from "@/lib/auth/queries";
import i18n, { setSSRLanguage } from "@/lib/intl/i18n";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

type RootContext = {
  orpc: typeof orpc;
  queryClient: QueryClient;
  session: AuthSession | null;
};

export const Route = createRootRouteWithContext<RootContext>()({
  beforeLoad: async ({ context }) => {
    // we're using react-query for client-side caching to reduce client-to-server calls, see /src/router.tsx
    // better-auth's cookieCache is also enabled server-side to reduce server-to-db calls, see /src/lib/auth/auth.ts
    context.queryClient.prefetchQuery(authQueryOptions());
    await setSSRLanguage();

    // typically we don't need the user immediately in landing pages,
    // so we're only prefetching here and not awaiting.
    // for protected routes with loader data, see /(authenticated)/route.tsx
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: DEFAULT_SITE_NAME,
        description:
          "An open-source, production-ready template featuring Authentication, Payments, Database, i18n, and more.",
        image: "/images/landing/hero-bg.png",
      }).meta,
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#ffffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  wrapInSuspense: true,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Mark hydration as complete after React hydrates
              if (typeof window !== 'undefined') {
                // Use requestAnimationFrame to ensure this runs after hydration
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    document.documentElement.classList.add('hydrated');
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem

          
        >
          <I18nextProvider defaultNS={"translation"} i18n={i18n}>
            {children}
            <Toaster />
            <TanStackDevtools
              config={{ defaultOpen: false }}
              eventBusConfig={{
                connectToServerBus: true,
              }}
              plugins={[
                {
                  name: "Tanstack Query",
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                aiDevtoolsPlugin(),
              ]}
            />

            <Scripts />
          </I18nextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
