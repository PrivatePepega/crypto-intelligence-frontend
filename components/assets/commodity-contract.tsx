import { FileCode2, Building2, Calendar, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommodityAssetResponse } from "@/lib/asset-api";
import { hasValue } from "@/lib/asset-format";

type CommodityContractProps = {
  contract: NonNullable<CommodityAssetResponse["commodity"]>["contract"];
};

export function CommodityContract({ contract }: CommodityContractProps) {
  const hasData = hasValue(contract.exchange) || hasValue(contract.tradeMonth) || hasValue(contract.contractYear);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="size-4" />
            Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No contract data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="size-4" />
          Contract Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hasValue(contract.exchange) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Exchange</dt>
              <dd className="text-sm font-medium">
                <Badge variant="outline" className="gap-1">
                  <Building2 className="size-3" />
                  {contract.exchange}
                </Badge>
              </dd>
            </div>
          )}
          {hasValue(contract.tradeMonth) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Contract Month</dt>
              <dd className="text-sm font-medium">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="size-3" />
                  {contract.tradeMonth}
                </Badge>
              </dd>
            </div>
          )}
          {hasValue(contract.contractYear) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Contract Year</dt>
              <dd className="text-sm font-medium">{contract.contractYear}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}