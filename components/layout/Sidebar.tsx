"use client"

import {
  BarChart3,
  BookOpen,
  FileCode2,
  Home,
  Newspaper,
  Radio,
  Sparkles,
  Zap,
  RefreshCw,
  Star,
} from "lucide-react"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


const navigation = [
  {
    name: "Overview",
    icon: Home,
    href: "overview",
  },
  {
    name: "News",
    icon: Newspaper,
    href: "news",
  },
  {
    name: "Community",
    icon: Radio,
    href: "community",
  },
  {
    name: "Contracts",
    icon: FileCode2,
    href: "contracts",
  },
  {
    name: "Metrics",
    icon: BarChart3,
    href: "metrics",
  },
  {
    name: "Analysis",
    icon: Sparkles,
    href: "analysis",
  },
  {
    name: "Events",
    icon: Zap,
    href: "events",
  },
  {
    name: "History",
    icon: BookOpen,
    href: "history",
  },
]

export function Sidebar() {

  const pathname = usePathname();
  const router = useRouter();
  const baseRoute = `/${pathname.split("/")[1]}`


  const handleRouter = (href: string) => {
    if (pathname === "/") return
  
    const baseRoute = `/${pathname.split("/")[1]}`
  
    router.push(`${baseRoute}/${href}`)
  }


  return (
    <aside className="flex h-[calc(100vh-4rem)] w-60 flex-col border-r bg-background">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Project
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const route = `${baseRoute}/${item.href}`

            const isActive =
            (item.href === "overview" && pathname === baseRoute) ||
            pathname === route ||
            pathname.startsWith(`${route}/`)

            return (
              <button
                key={item.name}
                onClick={() => handleRouter(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Actions */}
      <div className="border-t p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </p>

        <nav className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <RefreshCw className="size-4" />
            <span>Refresh Data</span>
          </button>

          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <Star className="size-4" />
            <span>Add to Watchlist</span>
          </button>
        </nav>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Last updated
          </p>

          <p className="mt-1 text-sm font-medium">
            2 hours ago
          </p>
        </div>
      </div>
    </aside>
  )
}