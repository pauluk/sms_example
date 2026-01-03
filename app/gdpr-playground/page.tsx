"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function GdprPlayground() {
    const [apiKey, setApiKey] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("07879678288");
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const handleSearch = async () => {
        setIsLoading(true);
        setResponse(null);
        try {
            const res = await fetch(`/api/v1/gdpr/search?number=${encodeURIComponent(phoneNumber)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            });

            const data = await res.json();
            setResponse({
                status: res.status,
                statusText: res.statusText,
                body: data
            });

            if (res.ok) {
                toast.success("Search successful");
            } else if (res.status === 404) {
                toast.info("No records found");
            } else {
                toast.error("Search failed");
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">GDPR Report API</h1>
                    <p className="text-muted-foreground mt-1">Search for SMS records by mobile number pattern (last 10 digits).</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Search Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Configuration</CardTitle>
                            <CardDescription>Enter your API Key and the number to search for.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key (Bearer Token)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="apiKey"
                                            type="text"
                                            className="font-mono text-sm"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="sk_live_..."
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setApiKey("sk_live_" + "X7j9K2mPz4L8nQ5vW1rY3tB6h")}
                                            title="Use Test Key"
                                            type="button"
                                            className="whitespace-nowrap"
                                        >
                                            Use Test Key
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="07879..."
                                    />
                                    <p className="text-xs text-muted-foreground">Searches strict match on last 10 digits.</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                className="w-full md:w-auto"
                                disabled={isLoading || !apiKey || !phoneNumber}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {response && (
                        <Card className={cn(
                            "transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                            response.status === 200 ? "border-green-200 bg-green-50/20" :
                                response.status === 404 ? "border-orange-200 bg-orange-50/20" : "border-red-200 bg-red-50/20"
                        )}>
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle>Result</CardTitle>
                                    <Badge variant={response.status >= 200 && response.status < 300 ? "default" : "secondary"}>
                                        {response.status} {response.statusText}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <pre className="text-xs font-mono bg-white p-4 rounded-lg border overflow-x-auto">
                                    {JSON.stringify(response.body, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
