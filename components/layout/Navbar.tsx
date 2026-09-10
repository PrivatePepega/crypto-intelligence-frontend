"use client"

import { Search, User } from "lucide-react"
import Link from "next/link";
import { useState } from "react"

export function Navbar() {
  const [search, setSearch] = useState("")

  return (
    <nav className="flex h-16 items-center border-b bg-background px-6">
      {/* Logo */}
      <Link href="/">
        <div className="mr-8 flex items-center">
          <span className="text-xl font-bold">CryptoIntel</span>
        </div>
      </Link>


      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          placeholder="Search a crypto project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-md border bg-muted/30 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
        />

        {/* Temporary search results */}
        {search.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-50 rounded-md border bg-background p-2 shadow-lg">
            <button className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-muted">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted font-bold">
                D
              </div>

              <div>
                <p className="text-sm font-medium">Dogecoin</p>
                <p className="text-xs text-muted-foreground">DOGE</p>
              </div> 
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="ml-auto flex items-center gap-2">
        <Link href="/world">
          <button className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">
            World
          </button>
        </Link>

        <Link href="/crypto">
          <button className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">
            Crypto
          </button>
        </Link>


        <button className="ml-2 rounded-md p-2 hover:bg-muted">
          <User className="size-5" />
        </button>
      </div>
    </nav>
  )
}