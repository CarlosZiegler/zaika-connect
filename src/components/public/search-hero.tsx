import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck, BarChart3, MapPin, Search, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type SearchHeroProps = {
  defaultKeyword?: string;
  defaultLocation?: string;
  showTrustBadges?: boolean;
};

const TRUST_BADGES = [
  {
    i18nKey: "LANDING_TRUST_ACCURACY",
    icon: BarChart3,
  },
  {
    i18nKey: "LANDING_TRUST_NETWORK",
    icon: Users,
  },
  {
    i18nKey: "LANDING_TRUST_VERIFIED",
    icon: BadgeCheck,
  },
] as const;

export function SearchHero({
  defaultKeyword = "",
  defaultLocation = "",
  showTrustBadges = true,
}: SearchHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [location, setLocation] = useState(defaultLocation);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchParams: Record<string, string> = {};
    const trimmedKeyword = keyword.trim();
    const trimmedLocation = location.trim();

    if (trimmedKeyword) {
      searchParams.q = trimmedKeyword;
    }
    if (trimmedLocation) {
      searchParams.location = trimmedLocation;
    }

    navigate({
      to: "/jobs",
      search: searchParams,
    });
  };

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      {/* Search Bar */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl md:flex-row md:items-center md:justify-center">
          {/* Keywords Input */}
          <div className="flex flex-grow items-center gap-3 rounded-xl px-4">
            <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("LANDING_SEARCH_KEYWORDS_PLACEHOLDER")}
              className="w-full border-none bg-transparent py-4 text-slate-900 placeholder-slate-400 focus:ring-0"
              aria-label={t("LANDING_SEARCH_KEYWORDS_PLACEHOLDER")}
            />
          </div>

          {/* Location Input */}
          <div className="flex flex-grow items-center gap-3 rounded-xl border-slate-200 px-4 md:border-l">
            <MapPin className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("LANDING_SEARCH_LOCATION_PLACEHOLDER")}
              className="w-full border-none bg-transparent py-4 text-slate-900 placeholder-slate-400 focus:ring-0"
              aria-label={t("LANDING_SEARCH_LOCATION_PLACEHOLDER")}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-depth-5 px-8 py-4 font-bold text-white transition hover:bg-depth-4"
          >
            {t("LANDING_SEARCH_BUTTON")}
          </Button>
        </div>
      </form>

      {/* Trust Badges */}
      {showTrustBadges ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-200">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.i18nKey} className="flex items-center gap-2">
              <badge.icon className="size-4 text-ocean-1" aria-hidden="true" />
              <span>{t(badge.i18nKey)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
