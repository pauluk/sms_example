"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { LogOut, Settings, Users, Layout, BarChart3, Search } from "lucide-react"
import { useEffect, useState } from "react"

interface HeaderProps {
  user?: {
    name: string
    email: string
    role?: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [canAccessGDPR, setCanAccessGDPR] = useState(false)

  const isAdmin = user?.role === "admin"
  const isGDPR = user?.role === "gdpr"
  const isTeam = user && !isAdmin && !isGDPR

  useEffect(() => {
    setMounted(true)

    // Fetch system config to check GDPR visibility (public/restricted logic handled by API proxy or public endpoint)
    // We switched to checking /api/system/config which is public-ish
    fetch("/api/system/config")
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (isAdmin && data.showGdprToAdmin) {
            setCanAccessGDPR(true);
          } else if (!isAdmin && data.showGdprToTeams) {
            setCanAccessGDPR(true);
          }
        }
      })
      .catch(console.error)
  }, [isAdmin])

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
  }



  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground shadow-md">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity animate-wavey-fall">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-foreground text-primary font-bold text-lg">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">FinOps</span>
              <span className="text-xs leading-none opacity-90">SMS Service</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!isGDPR && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Layout className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/usage">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Usage
                  </Button>
                </Link>
              </>
            )}

            {(canAccessGDPR || isGDPR) && (
              <Link href="/dashboard/gdpr">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Search className="mr-2 h-4 w-4" />
                  GDPR
                </Button>
              </Link>
            )}

            {isAdmin && (
              <>
                <Link href="/dashboard/users">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                </Link>
                <Link href="/dashboard/admin/settings">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Settings className="mr-2 h-4 w-4" />
                    System
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <div className="text-right">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none opacity-80 mt-1">{user.email}</p>
              </div>
              {isAdmin && (
                <span className="inline-flex items-center rounded-full bg-primary-foreground/20 px-2 py-1 text-xs font-semibold">
                  Admin
                </span>
              )}
            </div>
          )}

          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-primary-foreground hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
