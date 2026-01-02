"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TemplateCardProps {
  title: string
  description?: string
  isCustom?: boolean
  isSaved?: boolean
  onClick: () => void
  className?: string
}

export function TemplateCard({
  title,
  description,
  isCustom = false,
  isSaved = false,
  onClick,
  className,
}: TemplateCardProps) {
  if (isCustom) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-dashed border-muted-foreground/30 bg-muted/20",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[180px]">
          <div className="rounded-full bg-primary/10 p-4 mb-3">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-lg">{title}</CardTitle>
          {description && (
            <CardDescription className="text-center mt-2 text-sm">
              {description}
            </CardDescription>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative group",
        className
      )}
      onClick={onClick}
    >
      {isSaved && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 bg-primary/10 text-primary border-primary/20"
        >
          Saved
        </Badge>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base leading-tight">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {description && (
          <CardDescription className="text-sm line-clamp-3">
            {description}
          </CardDescription>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full group-hover:bg-primary/10 transition-colors"
        >
          Use Template →
        </Button>
      </CardContent>
    </Card>
  )
}
