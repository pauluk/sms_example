"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileCheck, AlertCircle, FileText, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TEAMS } from "@/config/teams";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("GDPR SMS Audit Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Mobile Number: ${mobile.replace(/\s/g, '')} (Last 10 digits matched)`, 14, 35);


        if (!results || results.length === 0) {
            // Nil Return
            doc.setFillColor(240, 253, 244); // green-50
            doc.rect(14, 45, 182, 30, 'F');
            doc.setDrawColor(34, 197, 94); // green-500
            doc.setLineWidth(1);
            doc.line(14, 45, 14, 75); // Left border

            doc.setFontSize(14);
            doc.setTextColor(21, 128, 61); // green-700
            doc.text("Nil Return Report", 20, 58);

            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(`No records found for ${mobile}. This mobile number is not present in the SMS logs.`, 20, 66);
        } else {
            // Data Table
            doc.setFillColor(254, 252, 232); // yellow-50
            doc.rect(14, 45, 182, 30, 'F');
            doc.setDrawColor(234, 179, 8); // yellow-500
            doc.setLineWidth(1);
            doc.line(14, 45, 14, 75);

            doc.setFontSize(14);
            doc.setTextColor(161, 98, 7); // yellow-700
            doc.text("Data Found", 20, 58);
            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(`Found ${results.length} record(s) for ${mobile}.`, 20, 66);

            const tableData = results.map(log => [
                new Date(log.sentAt || log.createdAt).toLocaleString(),
                TEAMS[log.teamId as keyof typeof TEAMS]?.label || log.teamId,
                `${log.userName || "Unknown"} (${log.userEmail || ""})`,
                log.status,
                log.message
            ]);

            autoTable(doc, {
                startY: 85,
                head: [['Date & Time', 'Team', 'Sent By', 'Status', 'Message']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] }
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
            doc.text("Fin Ops SMS Application - Official Sensitive", 14, 285);
        }

        doc.save(`GDPR_Report_${mobile.replace(/\+/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportTXT = () => {
        let content = `GDPR SMS AUDIT REPORT\n`;
        content += `=====================\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Mobile Number: ${mobile.replace(/\s/g, '')} (Last 10 digits matched)\n\n`;

        if (!results || results.length === 0) {
            content += `RESULT: NIL RETURN / CLEAN\n`;
            content += `No records found for ${mobile}.\n`;
        } else {
            content += `RESULT: DATA FOUND (${results.length} records)\n\n`;
            content += `AUDIT TRAIL:\n`;
            content += `----------------------------------------\n`;

            results.forEach((log, index) => {
                content += `RECORD #${index + 1}\n`;
                content += `Date: ${new Date(log.sentAt || log.createdAt).toLocaleString()}\n`;
                content += `Team: ${TEAMS[log.teamId as keyof typeof TEAMS]?.label || log.teamId}\n`;
                content += `Sent By: ${log.userName || "Unknown"} (${log.userEmail || ""})\n`;
                content += `Status: ${log.status}\n`;
                content += `Message: ${log.message}\n`;
                content += `----------------------------------------\n`;
            });
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GDPR_Report_${mobile.replace(/\+/g, '')}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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

                            <div className="flex gap-2 ml-auto">
                                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportTXT}>
                                    <Download className="mr-2 h-4 w-4" />
                                    TXT
                                </Button>
                            </div>
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
