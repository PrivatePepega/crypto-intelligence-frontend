import type { ReactNode } from "react";

import { cleanBriefText } from "@/lib/brief-format";
import { cn } from "@/lib/utils";

type BriefBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "divider" };

const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(BOLD_PATTERN.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    nodes.push(
      <strong
        key={`strong-${match.index}`}
        className="font-semibold text-foreground"
      >
        {match[1]}
      </strong>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Parses the small markdown subset the climate brief uses: `#`/`##` headings,
 * standalone bold lines, `-` bullets, horizontal rules, and inline bold. The
 * document's own `#` title is dropped because the UI shows the chapter title.
 *
 * This is a deterministic text renderer, not a markdown engine. Anything it
 * does not recognize is rendered as plain text.
 */
function parseBriefMarkdown(markdown: string): BriefBlock[] {
  const blocks: BriefBlock[] = [];
  const lines = markdown.split(/\r?\n/);

  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;

    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;

    blocks.push({ kind: "list", items: list });
    list = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushAll();
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushAll();

      const level = headingMatch[1].length;
      if (level > 1) {
        blocks.push({
          kind: "heading",
          level,
          text: cleanBriefText(headingMatch[2]),
        });
      }
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushAll();
      blocks.push({ kind: "divider" });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(cleanBriefText(line.replace(/^[-*]\s+/, "")));
      continue;
    }

    const boldHeading = /^\*\*([^*]+)\*\*\s*:?\s*$/.exec(line);
    if (boldHeading) {
      flushAll();
      blocks.push({
        kind: "heading",
        level: 3,
        text: cleanBriefText(boldHeading[1]),
      });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}

export function BriefMarkdown({ content }: { content: string }) {
  const blocks = parseBriefMarkdown(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <h4
                key={`heading-${index}`}
                className={cn(
                  "text-foreground",
                  block.level === 2 &&
                    "border-b pb-1.5 text-base font-semibold tracking-tight",
                  block.level === 3 &&
                    "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  block.level >= 4 && "text-sm font-semibold"
                )}
              >
                {renderInline(block.text)}
              </h4>
            );

          case "paragraph":
            return (
              <p
                key={`paragraph-${index}`}
                className="text-sm leading-7 text-foreground/80 sm:text-[15px]"
              >
                {renderInline(block.text)}
              </p>
            );

          case "list":
            return (
              <ul
                key={`list-${index}`}
                className="space-y-2 text-sm leading-7 text-foreground/80 sm:text-[15px]"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`item-${itemIndex}`} className="flex gap-2.5">
                    <span className="mt-[0.7rem] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case "divider":
            return (
              <hr
                key={`divider-${index}`}
                className="border-border/70"
              />
            );
        }
      })}
    </div>
  );
}
