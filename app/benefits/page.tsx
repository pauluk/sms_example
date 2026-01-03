"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CalculatorInputs, CalculatorState } from "@/components/calculator/calculator-inputs";
import { CalculatorCharts } from "@/components/calculator/calculator-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function BenefitsCalculatorPage() {
    const router = useRouter();
    const pdfRef = useRef<HTMLDivElement>(null);

    // Initial State
    const [state, setState] = useState<CalculatorState>({
        volume: 1000,
        smsSegments: 1,
        letterMethod: 'inhouse',
        sheetsPerLetter: 1,
        paperCostPence: 1.5,
        printMode: 'mono',
        printCostPence: 0,
        postageMode: 'second',
        manualPostagePounds: 0.50,
        labourPct: 10,
        notifyLetterClass: 'second',
        smsAllowance: 30000,
        smsRatePence: 2.33,
        vatPct: 20,
        hostingMonthly: 20.00,
        overheadAllocMode: 'per_run',
        includeDomain: false,
        domainAnnual: 9.99,
        includeMaintenance: true,
        maintenanceAnnual: 300.00,
        letterCO2g: 22,
        smsCO2g: 0.1
    });

    const [isCopying, setIsCopying] = useState(false);

    const handleStateChange = (key: keyof CalculatorState, value: any) => {
        setState(prev => ({ ...prev, [key]: value }));
    };

    // Calculations
    const results = useMemo(() => {
        // Overheads
        const hostingAnnual = state.hostingMonthly * 12;
        const domain = state.includeDomain ? state.domainAnnual : 0;
        const maint = state.includeMaintenance ? state.maintenanceAnnual : 0;
        const overheadAnnual = hostingAnnual + domain + maint;
        const overheadPerRecipient = (state.overheadAllocMode === 'per_run' && state.volume > 0)
            ? overheadAnnual / state.volume
            : 0;
        const overheadForTotals = (state.overheadAllocMode === 'per_run')
            ? overheadPerRecipient * state.volume
            : overheadAnnual;

        // Letters
        let perLetterCost = 0;
        let letterDetail = "";

        if (state.letterMethod === 'notify_allin') {
            perLetterCost = state.notifyLetterClass === 'first' ? 0.68 : 0.59;
            letterDetail = "Notify all-in (1 page)";
        } else {
            // In-house
            let printPence = 0;
            if (state.printMode === 'mono') printPence = 10;
            else if (state.printMode === 'colour') printPence = 30;
            else printPence = state.printCostPence;

            let postage = 0;
            if (state.postageMode === 'first') postage = 1.70;
            else if (state.postageMode === 'second') postage = 0.87;
            else if (state.postageMode === 'contract') postage = 0.50;
            else postage = state.manualPostagePounds;

            const paperCost = (state.paperCostPence * state.sheetsPerLetter) / 100;
            const printCost = (printPence * state.sheetsPerLetter) / 100;
            const nonLabour = paperCost + printCost + postage;
            const labour = nonLabour * (state.labourPct / 100);

            perLetterCost = nonLabour + labour;
            letterDetail = `${state.sheetsPerLetter} sheet(s) • postage £${postage.toFixed(2)}`;
        }

        const perLetterWithOverhead = perLetterCost + overheadPerRecipient;
        const letterTotalBase = perLetterWithOverhead * state.volume;
        const letterTotalFair = letterTotalBase + (state.overheadAllocMode === 'per_year' ? overheadAnnual : 0);

        // SMS
        const smsTotalMessages = state.volume * state.smsSegments;
        const freeMsgs = Math.min(smsTotalMessages, state.smsAllowance);
        const chargeableMsgs = Math.max(0, smsTotalMessages - state.smsAllowance);

        const vatMult = 1 + (state.vatPct / 100);
        const smsUsageCost = ((state.smsRatePence / 100) * chargeableMsgs) * vatMult;
        const smsTotal = smsUsageCost + overheadForTotals;

        // Carbon
        const letterKg = (state.volume * state.letterCO2g) / 1000;
        const smsKg = (smsTotalMessages * state.smsCO2g) / 1000;
        const avoidedKg = Math.max(0, letterKg - smsKg);

        // Savings
        const cashSaving = Math.max(0, letterTotalFair - smsTotal);

        return {
            letterTotal: letterTotalFair,
            smsTotal,
            cashSaving,
            letterKg,
            smsKg,
            avoidedKg,
            freeMsgs,
            chargeableMsgs,
            overheadTotal: overheadForTotals,
            variableTotal: smsUsageCost,
            letterDetail,
            smsTotalMessages,
            overheadAnnual // For PDF display
        };
    }, [state]);

    const handleCopySummary = async () => {
        const summary = `
Volume: ${state.volume.toLocaleString()} recipients
Method: ${results.letterDetail}
SMS: ${state.smsSegments} msg(s)/recipient → ${results.smsTotalMessages.toLocaleString()} total

Totals:
• Letters: £${results.letterTotal.toFixed(2)}
• SMS: £${results.smsTotal.toFixed(2)}
• Saving: £${results.cashSaving.toFixed(2)}

Carbon:
• Letters: ${results.letterKg.toFixed(2)} kgCO2e
• SMS: ${results.smsKg.toFixed(2)} kgCO2e
• Avoided: ${results.avoidedKg.toFixed(2)} kgCO2e
        `.trim();

        try {
            await navigator.clipboard.writeText(summary);
            setIsCopying(true);
            toast.success("Summary copied to clipboard");
            setTimeout(() => setIsCopying(false), 2000);
        } catch (err) {
            toast.error("Failed to copy summary");
        }
    };

    const handleDownloadPDF = async () => {
        if (!pdfRef.current) return;

        try {
            const canvas = await html2canvas(pdfRef.current, {
                scale: 2, // Better quality
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`benefits_calculator_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("PDF downloaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        }
    };

    // Format helpers
    const fMoney = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Savings Calculator</h1>
                            <p className="text-muted-foreground">Compare letters vs SMS via Notify (Cost + Carbon)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Inputs Column */}
                    <div className="lg:col-span-4">
                        <CalculatorInputs state={state} onChange={handleStateChange} />
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-white">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Letters Total</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold">{fMoney(results.letterTotal)}</div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{results.letterDetail}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">SMS Total</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold">{fMoney(results.smsTotal)}</div>
                                    <p className="text-xs text-muted-foreground mt-1 text-green-600">
                                        {results.chargeableMsgs.toLocaleString()} billed
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-50 border-emerald-100">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-800">Cash Saving</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold text-emerald-700">{fMoney(results.cashSaving)}</div>
                                    <p className="text-xs text-emerald-600 mt-1">
                                        {results.letterTotal > 0 ? `${((results.cashSaving / results.letterTotal) * 100).toFixed(1)}%` : '0%'} vs letters
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-emerald-50 border-emerald-100">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-800">Carbon Avoided</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold text-emerald-700">{results.avoidedKg.toFixed(2)} <span className="text-base font-normal">kg</span></div>
                                    <p className="text-xs text-emerald-600 mt-1">kgCO2e</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Area (also used for PDF capture) */}
                        <div ref={pdfRef} className="space-y-6 bg-white p-6 rounded-xl border">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Analysis Report</h2>
                                <Badge variant="outline" className="font-mono">
                                    {new Date().toLocaleDateString()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg mb-6">
                                <div>
                                    <span className="text-sm text-muted-foreground block">Cash Saving</span>
                                    <span className="text-2xl font-bold text-emerald-600">{fMoney(results.cashSaving)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block">Carbon Avoided</span>
                                    <span className="text-2xl font-bold text-emerald-600">{results.avoidedKg.toFixed(2)} kgCO2e</span>
                                </div>
                            </div>

                            <CalculatorCharts data={results} />

                            <div className="mt-6 pt-6 border-t">
                                <h3 className="font-semibold mb-2">Assumptions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                                    <div>• Volume: {state.volume.toLocaleString()} recipients</div>
                                    <div>• Letter Method: {state.letterMethod === 'inhouse' ? 'In-house' : 'Notify All-in'}</div>
                                    <div>• SMS Allowance: {state.smsAllowance.toLocaleString()}</div>
                                    <div>• SMS Rate: {state.smsRatePence}p + VAT</div>
                                    <div>• Overheads: {fMoney(results.overheadAnnual)}/yr</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleCopySummary}
                            >
                                {isCopying ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                Copy Summary
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
