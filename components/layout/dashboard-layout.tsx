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

import { Footer } from "./footer"

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
