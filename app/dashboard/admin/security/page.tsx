"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, ShieldAlert, RefreshCw, Loader2, ExternalLink, Package, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    const [filter, setFilter] = useState<'all' | 'vulnerable' | 'outdated'>('all');

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

    const filteredDependencies = dependencies.filter(dep => {
        if (filter === 'vulnerable') return dep.vulnerability?.isVulnerable;
        if (filter === 'outdated') return dep.latest && dep.latest !== dep.version;
        return true;
    });

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("Security Audit Report", 14, 22);

        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`App Version: v${appVersion}`, 14, 35);
        doc.text(`Filter Applied: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, 14, 40);

        const vulnCount = filteredDependencies.filter(d => d.vulnerability?.isVulnerable).length;
        doc.text(`Vulnerabilities (in view): ${vulnCount}`, 14, 45);

        // Table
        const tableBody = filteredDependencies.map(dep => [
            dep.name,
            dep.type,
            dep.version,
            dep.latest || "-",
            dep.vulnerability?.isVulnerable ? "VULNERABLE" : "Pass",
            dep.vulnerability?.details || "-"
        ]);

        autoTable(doc, {
            head: [["Package", "Type", "Installed", "Latest", "Status", "Details"]],
            body: tableBody,
            startY: 50,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw === "VULNERABLE") {
                        data.cell.styles.textColor = [200, 0, 0];
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [0, 100, 0];
                    }
                }
            }
        });

        doc.save(`security-audit-${filter}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportTXT = () => {
        let content = `SECURITY AUDIT REPORT\n`;
        content += `=====================\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `App Version: v${appVersion}\n`;
        content += `Filter Applied: ${filter}\n`;
        content += `Packages Listed: ${filteredDependencies.length}\n\n`;

        content += `DEPENDENCY DETAILS\n`;
        content += `------------------\n`;

        filteredDependencies.forEach(dep => {
            const status = dep.vulnerability?.isVulnerable ? "VULNERABLE" : "PASS";
            const latest = dep.latest ? `(Latest: ${dep.latest})` : "";
            content += `[${status}] ${dep.name} @ ${dep.version} ${latest}\n`;
            if (dep.vulnerability?.isVulnerable) {
                content += `   WARN: ${dep.vulnerability.details}\n`;
            }
        });

        const blob = new Blob([content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `security-audit-${filter}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF} disabled={dependencies.length === 0}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportTXT} disabled={dependencies.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        TXT
                    </Button>
                    <Button onClick={handleRunScan} disabled={scanning || loading}>
                        {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {scanning ? "Scanning..." : "Run Security Scan"}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card
                    className={`cursor-pointer transition-colors ${filter === 'all' ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent'}`}
                    onClick={() => setFilter('all')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dependencies.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-colors ${filter === 'vulnerable' ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'hover:bg-red-50/50'} ${vulnCount > 0 ? "border-red-200" : ""}`}
                    onClick={() => setFilter('vulnerable')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${vulnCount > 0 ? "text-red-700" : "text-green-600"}`}>
                            {vulnCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Click to filter vulnerable</p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-colors ${filter === 'outdated' ? 'border-yellow-500 ring-1 ring-yellow-500 bg-yellow-50' : 'hover:bg-yellow-50/50'} ${outdatedCount > 0 ? "border-yellow-200" : ""}`}
                    onClick={() => setFilter('outdated')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Outdated Packages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${outdatedCount > 0 ? "text-yellow-700" : "text-green-600"}`}>
                            {outdatedCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Click to filter outdated</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Dependency List</CardTitle>
                            <CardDescription>
                                Showing {filter} packages ({filteredDependencies.length}).
                            </CardDescription>
                        </div>
                        {filter !== 'all' && (
                            <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                                Clear Filter
                            </Button>
                        )}
                    </div>
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
                                {filteredDependencies.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            No packages found matching filter "{filter}".
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredDependencies.map((dep) => (
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
