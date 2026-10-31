import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssetLoadErrorProps = {
  title: string;
  message: string;
};

/**
 * Shown when the backend cannot return intelligence for a route id, either
 * because the ticker is unknown or because the upstream providers failed.
 */
export function AssetLoadError({ title, message }: AssetLoadErrorProps) {
  return (
    <Card className="max-w-3xl" role="alert">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
