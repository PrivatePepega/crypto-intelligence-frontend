import { Building2, TrendingUp, ExternalLink, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { formatCompactNumber, formatMoney, formatPercent, hasValue } from "@/lib/asset-format";

type ExchangeType = NonNullable<CryptoAssetResponse["exchanges"]>[number];

type CryptoExchangesProps = {
  exchanges: CryptoAssetResponse["exchanges"];
};

export function CryptoExchanges({ exchanges }: CryptoExchangesProps) {
  const hasData = (exchanges?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" />
            Exchanges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No exchange data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4" />
          Exchanges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Exchange</TableHead>
                <TableHead className="text-right">24h Volume</TableHead>
                <TableHead className="text-right">Quote Volume</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges!.map((ex: ExchangeType, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{ex.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {hasValue(ex.volume24h)
                      ? formatMoney(ex.volume24h!, "USD")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {hasValue(ex.quoteVolume24h)
                      ? formatMoney(ex.quoteVolume24h!, "USD")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {hasValue(ex.percentOfTotalVolume)
                      ? `${ex.percentOfTotalVolume!.toFixed(2)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ex.isVerified ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {ex.isVerified ? (
                        <>
                          <CheckCircle className="size-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <ExternalLink className="size-3" />
                          Unverified
                        </>
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}