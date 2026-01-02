"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MessagePreviewProps {
  message: string
  onCopy?: () => void
  className?: string
}

export function MessagePreview({ message, onCopy, className }: MessagePreviewProps) {
  const charCount = message.length
  const maxChars = 160
  const isOverLimit = charCount > maxChars
  const charsRemaining = maxChars - charCount

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    toast.success("Message copied to clipboard")
    onCopy?.()
  }

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Message Preview</CardTitle>
          <Badge
            variant={isOverLimit ? "destructive" : charCount > 140 ? "warning" : "success"}
            className="font-mono"
          >
            {charCount}/{maxChars}
          </Badge>
        </div>
        <CardDescription>
          {isOverLimit ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              Message exceeds 160 character limit
            </span>
          ) : charsRemaining <= 20 ? (
            <span className="text-warning-foreground">
              {charsRemaining} characters remaining
            </span>
          ) : (
            "Preview of your SMS message"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Phone mockup */}
          <div className="rounded-lg border-2 border-border bg-background p-4 shadow-inner min-h-[200px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">GOV.UK Notify</span>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message || "Your message will appear here..."}
                </p>
              </div>
            </div>
          </div>

          {/* Copy button */}
          {message && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Message
              </Button>
            </div>
          )}
        </div>

        {/* Character breakdown */}
        {charCount > 0 && (
          <div className="mt-4 pt-4 border-t space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Messages</span>
              <span className="font-medium">{Math.ceil(charCount / 160)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Characters</span>
              <span className="font-medium">{charCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
