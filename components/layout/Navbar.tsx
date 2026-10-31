"use client"

import { Loader2, Search, User } from "lucide-react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react"

import { buttonVariants } from "@/components/ui/button";
import { useAssetSearch } from "@/hooks/use-asset-search";
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_ORDER,
  assetHref,
  type AssetSearchResult,
  type AssetType,
} from "@/lib/asset-types";
import { cn } from "@/lib/utils";

type ResultGroup = {
  type: AssetType;
  entries: Array<{ asset: AssetSearchResult; index: number }>;
};

export function Navbar() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const listboxId = useId()
  const { results, isLoading, error } = useAssetSearch(query)

  const trimmedQuery = query.trim()
  const showPanel = open && trimmedQuery.length > 0

  // Highlight the best match as soon as results arrive so Enter works without
  // pressing ArrowDown first. Adjusting state during render avoids the extra
  // commit an effect would cause.
  const [syncedResults, setSyncedResults] = useState(results)

  if (results !== syncedResults) {
    setSyncedResults(results)
    setActiveIndex(results.length > 0 ? 0 : -1)
  }

  const groups = useMemo<ResultGroup[]>(() => {
    const grouped = ASSET_TYPE_ORDER.map((type) => {
      const entries: ResultGroup["entries"] = []

      results.forEach((asset, index) => {
        if (asset.type === type) {
          entries.push({ asset, index })
        }
      })

      return { type, entries }
    })

    return grouped.filter((group) => group.entries.length > 0)
  }, [results])

  const optionId = (index: number) => `${listboxId}-option-${index}`

  // Keep the keyboard-highlighted option visible in the scroll container.
  useEffect(() => {
    if (!showPanel || activeIndex < 0) {
      return
    }

    document
      .getElementById(`${listboxId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, showPanel, listboxId])

  const selectAsset = (asset: AssetSearchResult) => {
    setQuery("")
    setOpen(false)
    setActiveIndex(-1)
    router.push(assetHref(asset))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (results.length === 0) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((previous) => (previous + 1) % results.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((previous) =>
        previous <= 0 ? results.length - 1 : previous - 1
      )
      return
    }

    if (event.key === "Enter") {
      if (!showPanel) {
        return
      }

      event.preventDefault()
      const asset = results[activeIndex >= 0 ? activeIndex : 0]

      if (asset) {
        selectAsset(asset)
      }
    }
  }

  return (
    <nav className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Logo */}
      <Link href="/">
        <div className="mr-4 flex items-center md:mr-8">
          <span className="text-xl font-bold">CryptoIntel</span>
        </div>
      </Link>


      {/* Search */}
      <div
        className="relative hidden w-80 shrink-0 md:block"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setOpen(false)
            setActiveIndex(-1)
          }
        }}
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          role="combobox"
          aria-label="Search assets"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          placeholder="Search stocks, crypto, commodities..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (trimmedQuery.length > 0) {
              setOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-md border bg-muted/30 pl-10 pr-10 text-sm outline-none transition focus:border-primary"
        />

        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {showPanel && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-md border bg-background shadow-lg">
            {error ? (
              <p className="px-3 py-3 text-sm text-destructive">{error}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {isLoading ? "Searching..." : `No assets match "${trimmedQuery}".`}
              </p>
            ) : (
              <div
                id={listboxId}
                role="listbox"
                aria-label="Asset search results"
                className="max-h-80 overflow-y-auto p-1"
              >
                {groups.map((group) => (
                  <div
                    key={group.type}
                    role="group"
                    aria-label={ASSET_TYPE_LABELS[group.type]}
                  >
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {ASSET_TYPE_LABELS[group.type]}
                    </p>

                    {group.entries.map(({ asset, index }) => (
                      <button
                        key={`${asset.type}-${asset.id}`}
                        id={optionId(index)}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        onClick={() => selectAsset(asset)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md p-2 text-left",
                          index === activeIndex ? "bg-muted" : "hover:bg-muted"
                        )}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                          {asset.symbol.slice(0, 2)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {asset.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {asset.symbol}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centered in the gap between the search field and the account button */}
      <div className="flex flex-1 justify-center px-2">
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Home
        </Link>
      </div>

      <Link
        href="/user"
        aria-label="Your account"
        className="shrink-0 rounded-md p-2 hover:bg-muted"
      >
        <User className="size-5" />
      </Link>
    </nav>
  )
}
