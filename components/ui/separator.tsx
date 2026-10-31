"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "cn";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      orientation={orientation}
      {...props}
    />
  );
}

export { Separator };