import { Globe, Link2, FileCode2, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { hasValue } from "@/lib/asset-format";

type CryptoNetworkProps = {
  network: NonNullable<CryptoAssetResponse["network"]>;
};

export function CryptoNetwork({ network }: CryptoNetworkProps) {
  const hasData = hasValue(network.primary) || (network.contracts?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-4" />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No network data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="size-4" />
          Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasValue(network.primary) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Network
            </h4>
            <Badge variant="outline" className="gap-1">
              <Globe className="size-3" />
              {network.primary}
            </Badge>
          </div>
        )}

        {(network.contracts?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contracts
            </h4>
            <div className="space-y-2">
              {network.contracts!.map((contract, idx) => (
                <div key={idx} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-3 rounded-md bg-muted/40">
                  <div className="flex items-center gap-2 text-sm">
                    <FileCode2 className="size-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{contract.network}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded truncate max-w-[200px]">
                      {contract.address}
                    </code>
                    <a
                      href={`https://${contract.network === "ethereum" ? "etherscan.io" : contract.network === "bsc" ? "bscscan.com" : contract.network === "polygon" ? "polygonscan.com" : "etherscan.io"}/token/${contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Link2 className="size-3" />
                      Explorer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasValue(network.primary) && (network.contracts?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No network information stored.</p>
        )}
      </CardContent>
    </Card>
  );
}