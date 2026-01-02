"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileCheck, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TEAMS } from "@/config/teams";

export default function GDPRPage() {
    const [mobile, setMobile] = useState("");
    const [results, setResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mobile) return;

        setLoading(true);
        setResults(null);

        try {
            // Note: Updated API path to shared route
            const res = await fetch(`/api/gdpr?mobile=${encodeURIComponent(mobile)}`);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 403) throw new Error("Unauthorized: You do not have permission to access GDPR search.");
                throw new Error(data.error || "Failed to search");
            }

            setResults(data.logs);
            setHasSearched(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to search");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">GDPR Mobile Search</h1>
                <p className="text-muted-foreground mt-2">
                    Search for a mobile number to generate a report of all associated messages and audit trails.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label htmlFor="mobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Mobile Number
                            </label>
                            <Input
                                id="mobile"
                                type="text"
                                placeholder="+447700900000"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading || !mobile}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!loading && <Search className="mr-2 h-4 w-4" />}
                            Generate Report
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {hasSearched && (
                <div className="space-y-6">
                    {/* Report Header & Status */}
                    <Card className={results && results.length > 0 ? "border-l-4 border-l-yellow-500" : "border-l-4 border-l-green-500"}>
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {results && results.length > 0 ? (
                                    <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-green-100 text-green-700 rounded-full">
                                        <FileCheck className="h-6 w-6" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {results && results.length > 0 ? "Data Found" : "Nil Return Report"}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {results && results.length > 0
                                            ? `Found ${results.length} record(s) for ${mobile}`
                                            : `No records found for ${mobile}. This mobile number is not present in the SMS logs.`}
                                    </p>
                                </div>
                            </div>
                            {results && results.length === 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2 text-md">
                                    Clean
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    {results && results.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Trail</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Sent By</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[40%]">Message Content</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {new Date(log.sentAt || log.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {TEAMS[log.teamId as keyof typeof TEAMS]?.label || log.teamId}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{log.userName || "Unknown"}</span>
                                                        <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {log.message}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
