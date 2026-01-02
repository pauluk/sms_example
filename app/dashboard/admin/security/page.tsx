"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, ShieldAlert, RefreshCw, Loader2, ExternalLink, Package } from "lucide-react";

interface Dependency {
    name: string;
    version: string;
    type: 'dependency' | 'devDependency';
    latest?: string;
    vulnerability?: {
        isVulnerable: boolean;
        details?: string;
        severity?: string;
    };
    loading?: boolean;
}

export default function SecurityAuditPage() {
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [appVersion, setAppVersion] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState("");

    const fetchDependencies = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/security");
            if (!res.ok) throw new Error("Failed to fetch dependencies");
            const data = await res.json();
            setAppVersion(data.appVersion);
            setDependencies(data.dependencies.map((d: any) => ({ ...d, loading: false })));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDependencies();
    }, []);

    const scanPackage = async (dep: Dependency) => {
        // 1. Check Latest Version (NPM Registry)
        let latest = dep.version;
        try {
            const npmRes = await fetch(`https://registry.npmjs.org/${dep.name}/latest`);
            if (npmRes.ok) {
                const npmData = await npmRes.json();
                latest = npmData.version;
            }
        } catch (e) {
            console.error(`Failed to check npm for ${dep.name}`, e);
        }

        // 2. Check Vulnerabilities (OSV API)
        let vulnerability = { isVulnerable: false, details: "", severity: "None" };
        try {
            const osvRes = await fetch("https://api.osv.dev/v1/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    package: {
                        name: dep.name,
                        ecosystem: "npm"
                    },
                    version: dep.version
                })
            });

            if (osvRes.ok) {
                const osvData = await osvRes.json();
                if (osvData.vulns && osvData.vulns.length > 0) {
                    vulnerability = {
                        isVulnerable: true,
                        details: `${osvData.vulns.length} known vulnerabilitie(s).`,
                        severity: "High" // Simplified
                    };
                }
            }
        } catch (e) {
            console.error(`Failed to check OSV for ${dep.name}`, e);
        }

        return { ...dep, latest, vulnerability, loading: false };
    };

    const handleRunScan = async () => {
        setScanning(true);
        const newDeps = [...dependencies];

        // Mark all as loading visual or just process
        // We do it in chunks or parallel? Parallel is fast but browser might limit.
        // Let's do batches of 5.

        const batchSize = 5;
        for (let i = 0; i < newDeps.length; i += batchSize) {
            const batch = newDeps.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(d => scanPackage(d)));

            results.forEach((res, idx) => {
                newDeps[i + idx] = res;
            });
            setDependencies([...newDeps]); // Update UI progressively
        }

        setScanning(false);
    };

    const vulnCount = dependencies.filter(d => d.vulnerability?.isVulnerable).length;
    const outdatedCount = dependencies.filter(d => d.latest && d.latest !== d.version).length;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Security Audit</h1>
                        <Badge variant="outline" className="text-lg px-3 py-1">v{appVersion}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Scan installed dependencies against the OSV database and NPM registry for security and version health.
                    </p>
                </div>
                <Button onClick={handleRunScan} disabled={scanning || loading}>
                    {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {scanning ? "Scanning..." : "Run Security Scan"}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dependencies.length}</div>
                    </CardContent>
                </Card>
                <Card className={vulnCount > 0 ? "border-red-500 bg-red-50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${vulnCount > 0 ? "text-red-700" : "text-green-600"}`}>
                            {vulnCount}
                        </div>
                    </CardContent>
                </Card>
                <Card className={outdatedCount > 0 ? "border-yellow-500 bg-yellow-50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Outdated Packages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${outdatedCount > 0 ? "text-yellow-700" : "text-green-600"}`}>
                            {outdatedCount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dependency List</CardTitle>
                    <CardDescription>
                        Direct from system `package.json`.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Package</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Installed</TableHead>
                                    <TableHead>Latest</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dependencies.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            No dependencies found or API error.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {dependencies.map((dep) => (
                                    <TableRow key={dep.name}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            {dep.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{dep.type}</Badge>
                                        </TableCell>
                                        <TableCell>{dep.version}</TableCell>
                                        <TableCell className={dep.latest && dep.latest !== dep.version ? "text-yellow-600 font-medium" : ""}>
                                            {dep.latest || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {dep.vulnerability ? (
                                                dep.vulnerability.isVulnerable ? (
                                                    <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        Vulnerable
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex w-fit items-center gap-1">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Pass
                                                    </Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={`https://www.npmjs.com/package/${dep.name}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
