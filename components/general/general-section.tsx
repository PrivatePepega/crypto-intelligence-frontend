"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface GeneralSectionProps {
  index: number;
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
  /** Expand the panel on first render. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible numbered section for the General window. The whole header is a
 * button, so the section reads as a short table of contents until a user opens
 * it. Content is mounted on first open and then kept mounted, which preserves
 * tab selections when the section is collapsed again.
 */
export function GeneralSection({
  index,
  title,
  description,
  children,
  id,
  defaultOpen = false,
  className,
}: GeneralSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  const headingId = id
    ? `${id}-heading`
    : `general-section-${index}-heading`;
  const panelId = id ? `${id}-panel` : `general-section-${index}-panel`;

  const toggle = () => {
    setIsOpen((open) => {
      if (!open) setHasOpened(true);
      return !open;
    });
  };

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-24", className)}
    >
      <div className="overflow-hidden rounded-xl border bg-card/60">
        <h2 id={headingId} className="m-0">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={toggle}
            className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-4 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/60 font-mono text-xs font-semibold text-muted-foreground"
            >
              {String(index).padStart(2, "0")}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </span>
              <span className="mt-1 block max-w-4xl text-sm text-muted-foreground">
                {description}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-2 pt-1 text-xs font-medium text-muted-foreground">
              <span className="hidden sm:inline">
                {isOpen ? "Hide" : "Show"}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-5 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </span>
          </button>
        </h2>

        <div
          id={panelId}
          hidden={!isOpen}
          className="border-t bg-background/40 p-4 sm:p-5"
        >
          {hasOpened ? children : null}
        </div>
      </div>
    </section>
  );
}
