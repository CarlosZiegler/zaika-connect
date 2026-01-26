import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LocaleToggleProps = {
  locale: "de" | "en";
  onLocaleChange: (locale: "de" | "en") => void;
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
};

export function LocaleToggle({
  locale,
  onLocaleChange,
  compareMode,
  onCompareModeChange,
}: LocaleToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Locale:</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={locale === "de" ? "default" : "outline"}
            size="sm"
            onClick={() => onLocaleChange("de")}
            className={cn("min-w-12", locale === "de" && "pointer-events-none")}
          >
            DE
          </Button>
          <Button
            type="button"
            variant={locale === "en" ? "default" : "outline"}
            size="sm"
            onClick={() => onLocaleChange("en")}
            className={cn("min-w-12", locale === "en" && "pointer-events-none")}
          >
            EN
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="compare-mode"
          checked={compareMode}
          onCheckedChange={(checked) => onCompareModeChange(checked === true)}
        />
        <Label htmlFor="compare-mode" className="text-sm cursor-pointer">
          Compare mode
        </Label>
      </div>
    </div>
  );
}
