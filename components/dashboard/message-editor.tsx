"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Save, Clock } from "lucide-react"
import { MessagePreview } from "./message-preview"
import type { TeamConfig } from "@/config/teams"

interface MessageEditorProps {
  team: TeamConfig
  example?: { label: string; data: Record<string, string> }
  onBack: () => void
  onSend: (message: string, scheduledFor?: Date) => Promise<void>
  onSave?: (data: Record<string, string>, message: string) => void
}

export function MessageEditor({ team, example, onBack, onSend, onSave }: MessageEditorProps) {
  const [formData, setFormData] = useState<Record<string, string>>(example?.data || {})
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  // Generate message preview whenever form data changes
  useEffect(() => {
    const generatedMessage = team.generateMessage(formData)
    setMessage(generatedMessage)
  }, [formData, team])

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSend = async () => {
    if (!message.trim() || message.length > 160) return

    setSending(true)
    try {
      await onSend(message)
    } finally {
      setSending(false)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData, message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>{team.label}</CardDescription>
              </div>
              {example && (
                <Badge variant="secondary">
                  {example.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.inputs.map((input) => (
              <div key={input.name} className="space-y-2">
                <label htmlFor={input.name} className="text-sm font-medium leading-none">
                  {input.label}
                </label>
                <Input
                  id={input.name}
                  type={input.type || "text"}
                  placeholder={input.placeholder}
                  value={formData[input.name] || ""}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                  className="focus-visible:ring-yellow-400"
                />
              </div>
            ))}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleSend}
                disabled={sending || !message.trim() || message.length > 160}
                className="flex-1 govuk-button"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send Now"}
              </Button>

              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={!message.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
            </div>

            {/* Examples */}
            {team.examples && team.examples.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Quick Fill Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {team.examples.map((ex) => (
                    <Button
                      key={ex.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(ex.data)}
                    >
                      {ex.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <MessagePreview message={message} />
      </div>
    </div>
  )
}
