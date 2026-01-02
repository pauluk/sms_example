"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TEAMS } from "@/config/teams"

interface TeamSelectorProps {
  selectedTeam: string
  onTeamChange: (team: string) => void
  children: (teamKey: string) => React.ReactNode
}

export function TeamSelector({ selectedTeam, onTeamChange, children }: TeamSelectorProps) {
  const teamKeys = Object.keys(TEAMS)

  return (
    <Tabs value={selectedTeam} onValueChange={onTeamChange} className="w-full">
      <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
        {teamKeys.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-md px-4 py-2"
          >
            {TEAMS[key].label}
          </TabsTrigger>
        ))}
      </TabsList>

      {teamKeys.map((key) => (
        <TabsContent key={key} value={key} className="mt-6">
          {selectedTeam === key && children(key)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
