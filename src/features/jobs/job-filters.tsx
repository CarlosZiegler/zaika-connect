import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type EmploymentType,
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  type Industry,
  type Location,
  LOCATIONS,
} from "@/lib/constants/recruiting";

type Filters = {
  location?: string;
  employmentType?: string;
  industry?: string;
};

type JobFiltersProps = {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
};

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

function getLocationKey(location: Location): LocationKey {
  return `LOCATION_${location.toUpperCase()}` as LocationKey;
}

function getEmploymentTypeKey(type: EmploymentType): EmploymentTypeKey {
  return `EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}` as EmploymentTypeKey;
}

function getIndustryKey(industry: Industry): IndustryKey {
  return `INDUSTRY_${industry.toUpperCase()}` as IndustryKey;
}

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const { t } = useTranslation();

  const handleChange = (key: keyof Filters, value: string | null) => {
    if (!value) return;
    onFilterChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const handleClear = () => {
    onFilterChange({});
  };

  const hasFilters =
    filters.location ?? filters.employmentType ?? filters.industry;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={filters.location ?? "all"}
        onValueChange={(v) => handleChange("location", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_LOCATION")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {LOCATIONS.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(getLocationKey(loc))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.employmentType ?? "all"}
        onValueChange={(v) => handleChange("employmentType", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_TYPE")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {EMPLOYMENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(getEmploymentTypeKey(type))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.industry ?? "all"}
        onValueChange={(v) => handleChange("industry", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_INDUSTRY")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {INDUSTRIES.map((ind) => (
            <SelectItem key={ind} value={ind}>
              {t(getIndustryKey(ind))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button type="button" variant="ghost" onClick={handleClear}>
          {t("JOBS_FILTER_CLEAR")}
        </Button>
      ) : null}
    </div>
  );
}
