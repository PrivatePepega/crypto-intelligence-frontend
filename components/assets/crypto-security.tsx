import { Shield, AlertTriangle, CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { hasValue } from "@/lib/asset-format";

type CryptoSecurityProps = {
  security: NonNullable<CryptoAssetResponse["security"]>;
};

export function CryptoSecurity({ security }: CryptoSecurityProps) {
  const hasData =
    hasValue(security.summary) ||
    Object.keys(security.contractAnalysis ?? {}).length > 0 ||
    (security.riskFlags?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No security analysis available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-4" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasValue(security.summary) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </h4>
            <p className="text-sm text-muted-foreground">{security.summary}</p>
          </div>
        )}

        {Object.keys(security.contractAnalysis ?? {}).length > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contract Analysis
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(security.contractAnalysis!).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/40"
                >
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  {typeof value === "boolean" ? (
                    <Badge
                      variant={value ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {value ? (
                        <>
                          <CheckCircle className="size-3" /> Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3" /> Failed
                        </>
                      )}
                    </Badge>
                  ) : typeof value === "string" ? (
                    <Badge variant="outline">{value}</Badge>
                  ) : (
                    <Badge variant="outline">Present</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(security.riskFlags?.length ?? 0) > 0 && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="size-3 text-destructive" />
              Risk Flags
            </h4>
            <div className="flex flex-wrap gap-2">
              {security.riskFlags!.map((flag, idx) => (
                <Badge key={idx} variant="destructive" className="gap-1">
                  <AlertCircle className="size-3" />
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!hasValue(security.summary) &&
          Object.keys(security.contractAnalysis ?? {}).length === 0 &&
          (security.riskFlags?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              No detailed security data available.
            </p>
          )}
      </CardContent>
    </Card>
  );
}