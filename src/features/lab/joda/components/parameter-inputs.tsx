import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Parameter } from "../types";

type ParameterInputsProps = {
  parameters: Parameter[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

export function ParameterInputs({
  parameters,
  values,
  onChange,
}: ParameterInputsProps) {
  if (parameters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No parameters for this snippet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {parameters.map((param) => (
        <div key={param.id} className="space-y-2">
          <label htmlFor={param.id} className="text-sm font-medium">
            {param.label}
          </label>
          {param.type === "enum" ? (
            <Select
              value={String(values[param.id] ?? param.default ?? "")}
              onValueChange={(v) => onChange(param.id, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : param.type === "number" ? (
            <Input
              id={param.id}
              type="number"
              value={String(values[param.id] ?? param.default ?? "")}
              onChange={(e) => onChange(param.id, Number(e.target.value))}
            />
          ) : param.type === "date" ? (
            <Input
              id={param.id}
              type="date"
              value={
                values[param.id] === "today"
                  ? new Date().toISOString().split("T").at(0)
                  : String(values[param.id] ?? "")
              }
              onChange={(e) => onChange(param.id, e.target.value)}
            />
          ) : (
            <Input
              id={param.id}
              type="text"
              value={String(values[param.id] ?? param.default ?? "")}
              onChange={(e) => onChange(param.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
