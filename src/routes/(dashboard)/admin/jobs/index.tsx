import type { ColumnDef } from "@tanstack/react-table";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BriefcaseIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { TableActionsDropdown } from "@/components/table-actions-dropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGridEnhanced } from "@/components/ui/data-grid-enhanced";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  type Job,
  type JobFormData,
  JobFormDialog,
} from "@/features/admin/job-form-dialog";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { isAdminEmail } from "@/lib/auth/admin-check";
import { authQueryOptions } from "@/lib/auth/queries";
import { client, orpc } from "@/orpc/orpc-client";

export const Route = createFileRoute("/(dashboard)/admin/jobs/")({
  component: AdminJobsPage,
  beforeLoad: async ({ context }) => {
    const session =
      await context.queryClient.ensureQueryData(authQueryOptions());
    if (!isAdminEmail(session?.user?.email)) {
      throw redirect({ to: "/overview" });
    }
    return { session };
  },
});

type LocationKey =
  | "LOCATION_REMOTE"
  | "LOCATION_BERLIN"
  | "LOCATION_MUNICH"
  | "LOCATION_HAMBURG"
  | "LOCATION_FRANKFURT"
  | "LOCATION_HYBRID";

type EmploymentTypeKey =
  | "EMPLOYMENT_TYPE_FULL_TIME"
  | "EMPLOYMENT_TYPE_PART_TIME"
  | "EMPLOYMENT_TYPE_CONTRACT"
  | "EMPLOYMENT_TYPE_FREELANCE";

type IndustryKey =
  | "INDUSTRY_TECHNOLOGY"
  | "INDUSTRY_FINANCE"
  | "INDUSTRY_HEALTHCARE"
  | "INDUSTRY_MARKETING"
  | "INDUSTRY_SALES"
  | "INDUSTRY_ENGINEERING"
  | "INDUSTRY_DESIGN"
  | "INDUSTRY_OPERATIONS";

function getLocationKey(location: string): LocationKey {
  return `LOCATION_${location.toUpperCase()}` as LocationKey;
}

function getEmploymentTypeKey(type: string): EmploymentTypeKey {
  return `EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}` as EmploymentTypeKey;
}

function getIndustryKey(industry: string): IndustryKey {
  return `INDUSTRY_${industry.toUpperCase()}` as IndustryKey;
}

type JobListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string;
  employmentType: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function JobActionsDropdown({
  job,
  onEdit,
  onDelete,
}: {
  job: JobListItem;
  onEdit: (job: JobListItem) => void;
  onDelete: (job: JobListItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <TableActionsDropdown ariaLabel={t("ACTIONS")}>
      <DropdownMenuItem onClick={() => onEdit(job)}>
        <PencilIcon className="mr-2 size-4" />
        {t("EDIT")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onClick={() => onDelete(job)}
      >
        <TrashIcon className="mr-2 size-4" />
        {t("DELETE")}
      </DropdownMenuItem>
    </TableActionsDropdown>
  );
}

function AdminJobsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListItem | null>(null);

  // Fetch jobs
  const { data, isLoading } = useQuery(orpc.admin.jobs.list.queryOptions());

  const jobs = (data?.jobs ?? []) as JobListItem[];

  // Delete confirmation dialog
  const deleteDialog = useConfirmationDialog<JobListItem>({
    onConfirm: (job) => {
      deleteMutation.mutate({ id: job.id });
    },
  });

  // Create job mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<JobFormData, "autoSlug">) =>
      client.admin.jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
      });
      toast.success(t("ADMIN_JOBS_CREATE_SUCCESS"));
      setIsFormDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: (
      data: { id: string } & Partial<Omit<JobFormData, "autoSlug">>
    ) => client.admin.jobs.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
      });
      toast.success(t("ADMIN_JOBS_UPDATE_SUCCESS"));
      setIsFormDialogOpen(false);
      setEditingJob(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: (data: { id: string }) => client.admin.jobs.delete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
      });
      toast.success(t("ADMIN_JOBS_DELETE_SUCCESS"));
      deleteDialog.close();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      client.admin.jobs.toggleActive(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
      });
      toast.success(t("ADMIN_JOBS_STATUS_UPDATED"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    setEditingJob(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (job: JobListItem) => {
    setEditingJob(job);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = (data: Omit<JobFormData, "autoSlug">) => {
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (job: JobListItem, isActive: boolean) => {
    toggleActiveMutation.mutate({ id: job.id, isActive });
  };

  const columns: ColumnDef<JobListItem>[] = [
    {
      accessorKey: "title",
      header: t("ADMIN_JOBS_TABLE_TITLE"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: t("ADMIN_JOBS_TABLE_LOCATION"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPinIcon className="size-4 text-muted-foreground" />
          <span>{t(getLocationKey(row.original.location))}</span>
        </div>
      ),
    },
    {
      accessorKey: "employmentType",
      header: t("ADMIN_JOBS_TABLE_TYPE"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t(getEmploymentTypeKey(row.original.employmentType))}
        </Badge>
      ),
    },
    {
      accessorKey: "industry",
      header: t("ADMIN_JOBS_TABLE_INDUSTRY"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {t(getIndustryKey(row.original.industry))}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: t("ADMIN_JOBS_TABLE_STATUS"),
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={job.isActive}
              onCheckedChange={(checked) => handleToggleActive(job, checked)}
            />
            <span
              className={
                job.isActive ? "text-green-600" : "text-muted-foreground"
              }
            >
              {job.isActive
                ? t("ADMIN_JOBS_STATUS_ACTIVE")
                : t("ADMIN_JOBS_STATUS_INACTIVE")}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <JobActionsDropdown
          job={row.original}
          onDelete={deleteDialog.open}
          onEdit={handleEdit}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-2xl tracking-tight">
            {t("ADMIN_JOBS_TITLE")}
          </h2>
          <p className="text-muted-foreground">
            Manage job listings and applications.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="mr-2 size-4" />
          {t("ADMIN_JOBS_CREATE")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium text-lg">
            {t("ADMIN_JOBS_TITLE")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-12 text-center">
              <BriefcaseIcon className="mx-auto size-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium text-lg">
                {t("ADMIN_JOBS_EMPTY")}
              </h3>
              <Button className="mt-4" onClick={handleCreate}>
                <PlusIcon className="mr-2 size-4" />
                {t("ADMIN_JOBS_CREATE")}
              </Button>
            </div>
          ) : (
            <DataGridEnhanced
              columns={columns}
              data={jobs}
              enableRowSelection={false}
              getRowId={(row) => row.id}
              initialPageSize={10}
            >
              <DataGridEnhanced.Toolbar
                searchColumn="title"
                searchPlaceholder="Search jobs..."
                searchable={true}
                showColumnVisibility={true}
              />
              <DataGridEnhanced.Content emptyMessage={t("ADMIN_JOBS_EMPTY")} />
              <DataGridEnhanced.Pagination showRowsPerPage={true} />
            </DataGridEnhanced>
          )}
        </CardContent>
      </Card>

      <JobFormDialog
        isPending={createMutation.isPending || updateMutation.isPending}
        job={editingJob as Job | null}
        onOpenChange={(open) => {
          setIsFormDialogOpen(open);
          if (!open) setEditingJob(null);
        }}
        onSubmit={handleFormSubmit}
        open={isFormDialogOpen}
      />

      <AlertDialog
        onOpenChange={deleteDialog.setIsOpen}
        open={deleteDialog.isOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ADMIN_JOBS_DELETE")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ADMIN_JOBS_DELETE_CONFIRM")}
              {deleteDialog.item ? (
                <span className="mt-2 block font-medium">
                  "{deleteDialog.item.title}"
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("CANCEL")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteDialog.confirm}
            >
              {deleteMutation.isPending ? <Spinner className="mr-2" /> : null}
              {t("DELETE")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
