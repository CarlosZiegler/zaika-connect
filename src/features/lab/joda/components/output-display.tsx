import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OutputDisplayProps = {
  output: string | null;
  compareOutput?: { de: string; en: string } | null;
  compareMode: boolean;
  error?: string | null;
};

export function OutputDisplay({
  output,
  compareOutput,
  compareMode,
  error,
}: OutputDisplayProps) {
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono text-sm text-destructive">
            {error}
          </pre>
        </CardContent>
      </Card>
    );
  }

  if (compareMode && compareOutput) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">German (DE)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {compareOutput.de}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">English (EN)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {compareOutput.en}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!output) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select a snippet to see output
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap font-mono text-sm">{output}</pre>
      </CardContent>
    </Card>
  );
}
