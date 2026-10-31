import { TrendingUp, TrendingDown, Scale, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CommodityAssetResponse } from "@/lib/asset-api";
import { hasValue } from "@/lib/asset-format";

type CommodityFundamentalsProps = {
  fundamentals: NonNullable<CommodityAssetResponse["fundamentals"]>;
};

export function CommodityFundamentals({ fundamentals }: CommodityFundamentalsProps) {
  const sections = [
    { key: "valueDrivers", label: "Value Drivers", icon: Zap },
    { key: "supplyDemand", label: "Supply & Demand", icon: Scale },
    { key: "inflation", label: "Inflation", icon: TrendingUp },
  ];

  const hasData = sections.some((s) => {
    const val = fundamentals[s.key as keyof typeof fundamentals];
    return val && Object.keys(val as object).length > 0;
  });

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            Fundamentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No fundamentals data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4" />
          Fundamentals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, idx) => {
          const val = fundamentals[section.key as keyof typeof fundamentals] as Record<string, unknown> | null;
          if (!val || Object.keys(val).length === 0) return null;

          return (
            <div key={section.key} className="space-y-2">
              {idx > 0 && <Separator />}
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <section.icon className="size-3" />
                {section.label}
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(val).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="gap-1">
                    <span className="text-xs font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="text-xs">{v === true ? "Yes" : v === false ? "No" : String(v)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}