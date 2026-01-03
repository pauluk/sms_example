"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ApiPlayground() {
    // Default values as requested
    const [apiKey, setApiKey] = useState(""); // User must enter key manually due to security policy
    const [phoneNumber, setPhoneNumber] = useState("07879678288");
    const [message, setMessage] = useState("This is a test message from External System A");

    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("curl");

    const endpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/sms/send` : '/api/v1/sms/send';

    const generateCurl = () => {
        return `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "${phoneNumber}",
    "message": "${message.replace(/'/g, "'\\''")}"
  }'`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleExecute = async () => {
        setIsLoading(true);
        setResponse(null);
        try {
            const res = await fetch("/api/v1/sms/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    phoneNumber,
                    message
                })
            });

            const data = await res.json();
            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body: data
            });

            if (res.ok) {
                toast.success("Request successful");
            } else {
                toast.error("Request failed");
            }
        } catch (error: any) {
            setResponse({
                error: error.message || "Network Error"
            });
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
                        <p className="text-muted-foreground mt-1">Test the Secure SMS API endpoint in real-time.</p>
                    </div>
                    <a
                        href="/sms-api.postman_collection.json"
                        download="sms-api.postman_collection.json"
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download Postman Collection
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Request Configuration */}
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Request Config</CardTitle>
                            <CardDescription>Configure the payload and authentication.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key (Bearer Token)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="apiKey"
                                        type="text"
                                        className="font-mono text-sm flex-1"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk_live_..."
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => setApiKey("sk_live_" + "X7j9K2mPz4L8nQ5vW1rY3tB6h")}
                                        title="Use Test Key"
                                        type="button"
                                    >
                                        Use Test Key
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Default key pre-filled for testing.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+447700900000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message Content</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Enter your message here..."
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleExecute}
                                    className="w-full md:w-auto"
                                    disabled={isLoading || !apiKey || !message}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Send Request
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code & Response */}
                    <div className="space-y-6">
                        {/* Curl Preview */}
                        <Card className="bg-slate-950 text-slate-50 border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-mono text-slate-300">Request Preview</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800" onClick={() => copyToClipboard(generateCurl())}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 overflow-x-auto">
                                <pre className="text-xs font-mono leading-relaxed text-green-400">
                                    {generateCurl()}
                                </pre>
                            </CardContent>
                        </Card>

                        {/* Response View */}
                        <Card className={cn(
                            "transition-all duration-300",
                            response ? "opacity-100" : "opacity-50"
                        )}>
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle>Response</CardTitle>
                                    {response && (
                                        <Badge variant={response.status >= 200 && response.status < 300 ? "default" : "destructive"}>
                                            {response.status} {response.statusText}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 max-h-[300px] overflow-y-auto">
                                {!response ? (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground h-[150px] space-y-2">
                                        <Play className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">Execute a request to see the response</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground uppercase">Body</Label>
                                            <div className="bg-muted p-3 rounded-md overflow-x-auto">
                                                <pre className="text-xs font-mono">
                                                    {JSON.stringify(response.body, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground uppercase">Headers</Label>
                                            <div className="text-xs font-mono text-muted-foreground">
                                                {Object.entries(response.headers || {}).map(([k, v]) => (
                                                    <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
                                                        <span className="truncate">{k}:</span>
                                                        <span className="truncate text-foreground">{v as string}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
