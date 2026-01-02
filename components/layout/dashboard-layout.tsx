"use client"

import { Header } from "./header"
import { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
  user?: {
    name: string
    email: string
    role?: string
  } | null
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
