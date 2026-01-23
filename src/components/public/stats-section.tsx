import { useTranslation } from "react-i18next";

const STATS = [
  {
    value: "15,402",
    i18nKey: "LANDING_STATS_OPPORTUNITIES",
  },
  {
    value: "8,210",
    i18nKey: "LANDING_STATS_PARTNERSHIPS",
  },
  {
    value: "120,850",
    i18nKey: "LANDING_STATS_PROFILES",
  },
  {
    value: "98.2%",
    i18nKey: "LANDING_STATS_RETENTION",
  },
] as const;

export function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="border-b border-slate-100 bg-white py-12 dark:border-slate-800 dark:bg-depth-1">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.i18nKey} className="group cursor-default">
              <div className="text-3xl font-bold text-ocean-1 transition duration-300 group-hover:scale-110 dark:text-teal-400">
                {stat.value}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t(stat.i18nKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
