"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Send, X, FileText, AlertCircle, CheckCircle, XCircle, Download } from "lucide-react"
import { toast } from "sonner"
import type { TeamConfig } from "@/config/teams"

interface BulkUploadProps {
  team: TeamConfig
  onBack: () => void
}

interface ParsedRow {
  message: string
  recipient?: string
  valid: boolean
  errors: string[]
}

interface BulkResult {
  row: number
  recipient: string
  status: 'success' | 'failed'
  error?: string
}

export function BulkUpload({ team, onBack }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<BulkResult[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file")
      return
    }

    setFile(selectedFile)
    setResults(null)

    try {
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      // Skip header row if it exists
      const hasHeader = lines[0]?.toLowerCase().includes('message') || lines[0]?.toLowerCase().includes('recipient')
      const dataLines = hasHeader ? lines.slice(1) : lines

      const parsed: ParsedRow[] = dataLines.map((line) => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
        const message = parts[0] || ''
        const recipient = parts[1] || ''

        const errors: string[] = []
        if (!message) errors.push('Message is required')
        if (message.length > 160) errors.push('Message exceeds 160 characters')

        return {
          message,
          recipient,
          valid: errors.length === 0,
          errors
        }
      })

      setRows(parsed)
      toast.success(`Loaded ${parsed.length} rows from CSV`)
    } catch (error) {
      toast.error("Failed to parse CSV file")
      console.error(error)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setRows([])
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    const validRows = rows.filter(r => r.valid)
    if (validRows.length === 0) {
      toast.error("No valid rows to send")
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/send-sms-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map(r => ({
            message: r.message,
            recipient: r.recipient,
            teamId: team.id
          })),
          teamId: team.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send bulk SMS')
      }

      setResults(data.results)

      if (data.success) {
        toast.success(`Successfully sent ${data.sent} messages`)
      } else {
        toast.warning(`Sent ${data.sent} messages, ${data.failed} failed`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send bulk SMS')
      console.error(error)
    } finally {
      setSending(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'message,recipient\n"Hello, this is a test message",+447700900000\n"Another message example",+447700900001'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-sms-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk SMS Upload</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload a CSV file to send multiple messages at once</p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            CSV format: <code className="text-xs bg-muted px-1 py-0.5 rounded">message,recipient</code>
            <Button variant="link" size="sm" onClick={downloadTemplate} className="ml-2 h-auto p-0">
              <Download className="mr-1 h-3 w-3" />
              Download Template
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {rows.length > 0 && (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {rows.length > 0 && !results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview ({rows.length} rows)</CardTitle>
              <Button
                onClick={handleSend}
                disabled={sending || validCount === 0}
                className="govuk-button"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : `Send ${validCount} Messages`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-12">#</th>
                      <th className="px-4 py-2 text-left font-medium">Message</th>
                      <th className="px-4 py-2 text-left font-medium w-32">Characters</th>
                      <th className="px-4 py-2 text-left font-medium w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, index) => (
                      <tr key={index} className={!row.valid ? 'bg-destructive/5' : ''}>
                        <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-2">
                          <p className="line-clamp-2">{row.message || <span className="text-muted-foreground italic">Empty</span>}</p>
                          {row.errors.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              {row.errors.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={row.message.length > 160 ? 'destructive' : row.message.length > 140 ? 'warning' : 'secondary'}>
                            {row.message.length}/160
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          {row.valid ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Invalid
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Send Results</CardTitle>
            <CardDescription>
              {results.filter(r => r.status === 'success').length} succeeded,
              {results.filter(r => r.status === 'failed').length} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-12">#</th>
                      <th className="px-4 py-2 text-left font-medium">Recipient</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((result) => (
                      <tr key={result.row} className={result.status === 'failed' ? 'bg-destructive/5' : ''}>
                        <td className="px-4 py-2 text-muted-foreground">{result.row}</td>
                        <td className="px-4 py-2 font-mono text-xs">{result.recipient}</td>
                        <td className="px-4 py-2">
                          {result.status === 'success' ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {result.error || 'Message sent successfully'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => { setResults(null); handleRemoveFile(); }}>
                Upload New File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>First column: message (required, max 160 characters)</li>
                <li>Second column: recipient phone number (optional in test mode)</li>
                <li>First row can be a header (will be auto-detected)</li>
                <li>Use commas to separate columns</li>
                <li>Wrap text containing commas in double quotes</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Test Mode:</strong> All messages will be sent to the configured test number regardless of the recipient column.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
