"use client";

import type * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import {
  Beaker,
  Building2,
  Home,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import { NavItems } from "@/components/nav-items";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandMenu } from "@/features/command-search/command-menu";
import {
  OrganizationSelect,
  OrganizationSelectSkeleton,
} from "@/features/organizations/organizations.select";
import { isOrganizationsEnabled } from "@/lib/flags";
import { orpc } from "@/orpc/orpc-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();

  const { data: adminCheck } = useQuery({
    ...orpc.admin.check.isAdmin.queryOptions(),
  });

  const isAdmin = adminCheck?.isAdmin ?? false;

  const navItems = [
    {
      title: t("SIDEBAR_OVERVIEW"),
      url: "/overview",
      icon: Home,
    },
    {
      title: t("SIDEBAR_LAB"),
      icon: Beaker,
      children: [
        {
          title: t("SIDEBAR_CHAT"),
          url: "/lab/chat",
        },
        {
          title: t("LAB_BLOCK_GENERATOR_NAV"),
          url: "/lab/block-generator",
        },
      ],
    },
    {
      title: t("SIDEBAR_ORGANIZATION"),
      icon: Building2,
      children: [
        {
          title: t("ORG_OVERVIEW"),
          url: "/organizations/",
        },
        {
          title: t("MY_INVITES"),
          url: "/organizations/invitations/",
        },
      ],
    },
    isAdmin
      ? {
          title: t("SIDEBAR_ADMIN"),
          icon: ShieldCheck,
          children: [
            {
              title: t("SIDEBAR_ADMIN_JOBS"),
              url: "/admin/jobs",
            },
            {
              title: t("SIDEBAR_ADMIN_APPLICATIONS"),
              url: "/admin/applications",
            },
          ],
        }
      : null,
    {
      title: t("SETTINGS"),
      icon: Settings,
      children: [
        {
          title: t("SETTINGS_PROFILE_TITLE"),
          url: "/settings",
        },
        {
          title: t("SETTINGS_SECURITY_TITLE"),
          url: "/settings/security",
        },
        {
          title: t("SETTINGS_APPEARANCE_TITLE"),
          url: "/settings/appearance",
        },
        // Billing menu item - only shown when Stripe is enabled
        {
          title: t("SETTINGS_BILLING_TITLE"),
          url: "/settings/billing",
        },
      ],
    },
  ].filter((item): item is NonNullable<typeof item> => {
    if (item === null) return false;
    if (!isOrganizationsEnabled) {
      return item.url !== "/organizations";
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ClientOnly fallback={<OrganizationSelectSkeleton />}>
          <OrganizationSelect />
        </ClientOnly>
        <CommandMenu />
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={navItems?.filter(Boolean)} />
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <NavUser />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
