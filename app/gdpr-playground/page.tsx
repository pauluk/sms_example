"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Play, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function GdprPlayground() {
    const [apiKey, setApiKey] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("07879678288");
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("curl");

    const endpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/gdpr/search` : '/api/v1/gdpr/search';

    const generateCurl = () => {
        return `curl -X GET "${endpoint}?number=${encodeURIComponent(phoneNumber)}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`;
    };

    const generateNode = () => {
        return `const response = await fetch("${endpoint}?number=${encodeURIComponent(phoneNumber)}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  }
});

const data = await response.json();
console.log(data);`;
    };

    const generatePython = () => {
        return `import requests

url = "${endpoint}"
params = {
    "number": "${phoneNumber}"
}
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers, params=params)
print(response.json())`;
    };

    const generatePhp = () => {
        return `<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => '${endpoint}?number=${encodeURIComponent(phoneNumber)}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer ${apiKey}',
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
    };

    const generatePowerAutomate = () => {
        return `1. Search for "HTTP" (Green icon, Premium)
   *IMPORTANT: Do NOT use "Send HTTP request (SharePoint/Graph)"*
2. Method: GET
3. URI: ${endpoint}?number=${encodeURIComponent(phoneNumber)}
4. Headers:
   Authorization: Bearer ${apiKey}
   Content-Type: application/json`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

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
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">GDPR Report API</h1>
                        <p className="text-muted-foreground mt-1">Search for SMS records by mobile number pattern (last 10 digits).</p>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href="/downloads/ExampleAPIpowerautomate.zip"
                            download="ExampleAPIpowerautomate.zip"
                            className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Flow Template (Zip)
                        </a>
                        <a
                            href="/gdpr-api.postman_collection.json"
                            download="gdpr-api.postman_collection.json"
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Postman Collection
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Search Configuration */}
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Search Configuration</CardTitle>
                            <CardDescription>Enter your API Key and the number to search for.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-1">
                            <div className="space-y-4">
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
                                            onClick={() => setApiKey("sk_live_" + "wfV_V4n5RCIaCNzvgYqwzZK0b8mMruwG")}
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

                            <div className="pt-4">
                                <Button
                                    onClick={handleSearch}
                                    className="w-full"
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results & Integration */}
                    <div className="space-y-6">
                        {/* Code Snippets */}
                        <Card className="bg-slate-950 text-slate-50 border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-sm font-mono text-slate-300">Integration Code</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Tabs defaultValue="curl" className="w-full" onValueChange={setActiveTab}>
                                    <div className="flex items-center justify-between mb-4">
                                        <TabsList className="bg-slate-900 border-slate-800">
                                            <TabsTrigger value="curl" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">cURL</TabsTrigger>
                                            <TabsTrigger value="node" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Node.js</TabsTrigger>
                                            <TabsTrigger value="python" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Python</TabsTrigger>
                                            <TabsTrigger value="php" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">PHP</TabsTrigger>
                                            <TabsTrigger value="power" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Power Automate</TabsTrigger>
                                        </TabsList>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                            onClick={() => {
                                                if (activeTab === 'curl') copyToClipboard(generateCurl());
                                                if (activeTab === 'node') copyToClipboard(generateNode());
                                                if (activeTab === 'python') copyToClipboard(generatePython());
                                                if (activeTab === 'php') copyToClipboard(generatePhp());
                                                if (activeTab === 'power') copyToClipboard(generatePowerAutomate());
                                            }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="relative overflow-x-auto">
                                        <TabsContent value="curl" className="mt-0">
                                            <pre className="text-xs font-mono leading-relaxed text-green-400">
                                                {generateCurl()}
                                            </pre>
                                        </TabsContent>
                                        <TabsContent value="node" className="mt-0">
                                            <pre className="text-xs font-mono leading-relaxed text-blue-400">
                                                {generateNode()}
                                            </pre>
                                        </TabsContent>
                                        <TabsContent value="python" className="mt-0">
                                            <pre className="text-xs font-mono leading-relaxed text-yellow-400">
                                                {generatePython()}
                                            </pre>
                                        </TabsContent>
                                        <TabsContent value="php" className="mt-0">
                                            <pre className="text-xs font-mono leading-relaxed text-purple-400">
                                                {generatePhp()}
                                            </pre>
                                        </TabsContent>
                                        <TabsContent value="power" className="mt-0">
                                            <pre className="text-xs font-mono leading-relaxed text-pink-400">
                                                {generatePowerAutomate()}
                                            </pre>
                                        </TabsContent>
                                    </div>
                                </Tabs>
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
                        {!response && (
                            <Card className="opacity-50 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Play className="h-8 w-8 mb-2 opacity-20" />
                                    <p>Enter details and search to view results</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
