"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TEAMS } from "@/config/teams"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TeamSelector } from "@/components/dashboard/team-selector"
import { TemplateCard } from "@/components/dashboard/template-card"
import { MessageEditor } from "@/components/dashboard/message-editor"
import { BulkUpload } from "@/components/dashboard/bulk-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, UploadCloud } from "lucide-react"
import { toast } from "sonner"

type ViewMode = "SELECTION" | "EDITOR" | "HISTORY" | "BULK"

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  // State
  const [activeTeamKey, setActiveTeamKey] = useState("AP")
  const [viewMode, setViewMode] = useState<ViewMode>("SELECTION")
  const [selectedExample, setSelectedExample] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/")
    }
  }, [session, isPending, router])

  // Auto-select team based on user
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      if (user.teamId && user.role !== "admin") {
        setActiveTeamKey(user.teamId)
      }
    }
  }, [session])

  // Fetch audit logs when team changes
  useEffect(() => {
    const fetchLogs = async () => {
      const team = TEAMS[activeTeamKey]
      if (!team?.id) return

      try {
        const res = await fetch(`/api/audit-logs?teamId=${team.id}`)
        const data = await res.json()
        if (data.logs) setAuditLogs(data.logs)
      } catch (error) {
        console.error("Failed to fetch logs:", error)
      }
    }

    fetchLogs()
    setViewMode("SELECTION") // Reset view when changing teams
  }, [activeTeamKey])

  // Handlers
  const handleTemplateSelect = (example?: any) => {
    setSelectedExample(example || null)
    setViewMode("EDITOR")
  }

  const handleSendSMS = async (message: string, scheduledFor?: Date) => {
    const team = TEAMS[activeTeamKey]

    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          teamId: team.id,
          scheduledFor: scheduledFor?.toISOString(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          scheduledFor
            ? `SMS scheduled for ${scheduledFor.toLocaleString()}`
            : "SMS sent successfully!"
        )
        setViewMode("SELECTION")
        // Refresh logs
        const resLogs = await fetch(`/api/audit-logs?teamId=${team.id}`)
        const dataLogs = await resLogs.json()
        if (dataLogs.logs) setAuditLogs(dataLogs.logs)
      } else {
        toast.error(data.error || "Failed to send SMS")
      }
    } catch (error) {
      console.error("SMS error:", error)
      toast.error("An error occurred while sending SMS")
    }
  }

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const user = session.user as any
  const activeTeam = TEAMS[activeTeamKey]

  return (
    <DashboardLayout
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Send SMS Messages</h1>
          <p className="text-muted-foreground mt-1">
            Create and send SMS messages using GOV.UK Notify
          </p>
        </div>

        {/* Team Selector */}
        <TeamSelector selectedTeam={activeTeamKey} onTeamChange={setActiveTeamKey}>
          {(teamKey) => {
            const team = TEAMS[teamKey]

            // Editor View
            if (viewMode === "EDITOR") {
              return (
                <MessageEditor
                  team={team}
                  example={selectedExample}
                  onBack={() => setViewMode("SELECTION")}
                  onSend={handleSendSMS}
                />
              )
            }

            // Bulk Upload View
            if (viewMode === "BULK") {
              return (
                <BulkUpload
                  team={team}
                  onBack={() => setViewMode("SELECTION")}
                />
              )
            }

            // History View
            if (viewMode === "HISTORY") {
              return (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Message History</CardTitle>
                        <CardDescription>{team.label}</CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setViewMode("SELECTION")}>
                        Back
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {auditLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages sent yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {auditLogs.slice(0, 20).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">{log.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                log.status === "sent"
                                  ? "success"
                                  : log.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {log.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            // Selection View (Default)
            return (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("HISTORY")}
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    View History ({auditLogs.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("BULK")}
                    className="gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Bulk Send
                  </Button>
                </div>

                {/* Templates Grid */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Example Templates */}
                    {team.examples?.map((example) => (
                      <TemplateCard
                        key={example.label}
                        title={example.label}
                        description={team.generateMessage(example.data).substring(0, 100) + "..."}
                        onClick={() => handleTemplateSelect(example)}
                      />
                    ))}

                    {/* Custom Template */}
                    <TemplateCard
                      title="Create Custom"
                      description="Start from scratch with a blank message"
                      isCustom
                      onClick={() => handleTemplateSelect(null)}
                    />
                  </div>
                </div>
              </div>
            )
          }}
        </TeamSelector>
      </div>
    </DashboardLayout>
  )
}
