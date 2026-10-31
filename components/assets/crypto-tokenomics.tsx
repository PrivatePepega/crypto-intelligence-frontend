import { Calendar, Hash, RotateCcw, Tag, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { formatDate, hasValue } from "@/lib/asset-format";

type CryptoTokenomicsProps = {
  tokenomics: NonNullable<CryptoAssetResponse["tokenomics"]>;
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Smart Contract Platform": Sparkles,
  "Layer 1 (L1)": Sparkles,
  "Layer 2 (L2)": Sparkles,
  "Proof of Work (PoW)": Hash,
  "Proof of Stake (PoS)": RotateCcw,
  "FTX Holdings": Tag,
  "Bitcoin Ecosystem": Sparkles,
  "Ethereum Ecosystem": Sparkles,
  "Meme": Sparkles,
  "Dog-Themed": Sparkles,
  "GMCI 30 Index": Tag,
  "GMCI Index": Tag,
  "GMCI Meme Index": Tag,
  "Coinbase 50 Index": Tag,
};

export function CryptoTokenomics({ tokenomics }: CryptoTokenomicsProps) {
  const hasData =
    hasValue(tokenomics.genesisDate) ||
    hasValue(tokenomics.hashingAlgorithm) ||
    hasValue(tokenomics.blockTimeInMinutes) ||
    (tokenomics.categories?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="size-4" />
            Tokenomics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No tokenomics data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="size-4" />
          Tokenomics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hasValue(tokenomics.genesisDate) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Genesis Date</dt>
              <dd className="text-sm font-medium">{formatDate(tokenomics.genesisDate!)}</dd>
            </div>
          )}
          {hasValue(tokenomics.hashingAlgorithm) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Hashing Algorithm</dt>
              <dd className="text-sm font-medium font-mono">{tokenomics.hashingAlgorithm}</dd>
            </div>
          )}
          {hasValue(tokenomics.blockTimeInMinutes) && tokenomics.blockTimeInMinutes! > 0 && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Block Time</dt>
              <dd className="text-sm font-medium">{tokenomics.blockTimeInMinutes} min</dd>
            </div>
          )}
          {hasValue(tokenomics.hasSupplyBreakdown) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Supply Breakdown</dt>
              <dd className="text-sm font-medium">{tokenomics.hasSupplyBreakdown ? "Yes" : "No"}</dd>
            </div>
          )}
        </dl>

        {(tokenomics.categories?.length ?? 0) > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {tokenomics.categories!.map((category, idx) => {
                const Icon = CATEGORY_ICONS[category] || Tag;
                return (
                  <Badge key={idx} variant="outline" className="gap-1">
                    <Icon className="size-3" />
                    {category}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}