
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"

export interface CalculatorState {
    volume: number;
    smsSegments: number;
    letterMethod: 'inhouse' | 'notify_allin';
    sheetsPerLetter: number;
    paperCostPence: number;
    printMode: 'mono' | 'colour' | 'custom';
    printCostPence: number;
    postageMode: 'first' | 'second' | 'contract' | 'manual';
    manualPostagePounds: number;
    labourPct: number;
    notifyLetterClass: 'first' | 'second';
    smsAllowance: number;
    smsRatePence: number;
    vatPct: number;
    hostingMonthly: number;
    overheadAllocMode: 'per_run' | 'per_year';
    includeDomain: boolean;
    domainAnnual: number;
    includeMaintenance: boolean;
    maintenanceAnnual: number;
    letterCO2g: number;
    smsCO2g: number;
}

interface CalculatorInputsProps {
    state: CalculatorState;
    onChange: (key: keyof CalculatorState, value: any) => void;
}

export function CalculatorInputs({ state, onChange }: CalculatorInputsProps) {
    return (
        <Card className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Inputs
                </div>
                <p className="text-sm text-muted-foreground">Type any volume (unlimited). Use the slider for quick modelling (50–40,000).</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="volume">Volume (recipients)</Label>
                    <Input
                        id="volume"
                        type="number"
                        min={0}
                        value={state.volume}
                        onChange={(e) => onChange('volume', parseInt(e.target.value) || 0)}
                        className="font-mono mt-1.5"
                    />
                    <div className="mt-4 p-3 border rounded-xl bg-card">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Slider</span>
                            <span className="font-bold font-mono">{state.volume.toLocaleString()}</span>
                        </div>
                        <Slider
                            value={[Math.min(state.volume, 40000)]}
                            min={50}
                            max={40000}
                            step={50}
                            onValueChange={(vals: number[]) => onChange('volume', vals[0])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>50</span>
                            <span>40,000</span>
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="smsSegments">SMS messages per recipient</Label>
                    <Input
                        id="smsSegments"
                        type="number"
                        min={1}
                        value={state.smsSegments}
                        onChange={(e) => onChange('smsSegments', parseInt(e.target.value) || 1)}
                        className="font-mono mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">1 for short; 2+ if longer (counts as more messages).</p>
                </div>
            </div>

            <div className="h-px bg-border my-6" />

            {/* Letter Channel */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 8h16v12H4z" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 8l6-4 6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Letter channel
                </div>

                <div>
                    <Label>Letter method</Label>
                    <Select value={state.letterMethod} onValueChange={(val: any) => onChange('letterMethod', val)}>
                        <SelectTrigger className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inhouse">In-house letter (paper + print + labour + postage)</SelectItem>
                            <SelectItem value="notify_allin">Notify letter (all-in, 1 page)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {state.letterMethod === 'inhouse' ? (
                    <div className="space-y-4 pl-2 border-l-2 border-muted ml-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Sheets/letter</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={state.sheetsPerLetter}
                                    onChange={(e) => onChange('sheetsPerLetter', parseInt(e.target.value) || 1)}
                                    className="font-mono h-8 mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Paper (p/sheet)</Label>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={state.paperCostPence}
                                    onChange={(e) => onChange('paperCostPence', parseFloat(e.target.value) || 0)}
                                    className="font-mono h-8 mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Printing mode</Label>
                            <Select value={state.printMode} onValueChange={(val: any) => onChange('printMode', val)}>
                                <SelectTrigger className="h-8 mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mono">Mono (10p/sheet)</SelectItem>
                                    <SelectItem value="colour">Colour (30p/sheet)</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {state.printMode === 'custom' && (
                            <div>
                                <Label className="text-xs">Custom print (p/sheet)</Label>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={state.printCostPence}
                                    onChange={(e) => onChange('printCostPence', parseFloat(e.target.value) || 0)}
                                    className="font-mono h-8 mt-1"
                                />
                            </div>
                        )}

                        <div>
                            <Label className="text-xs">Postage</Label>
                            <Select value={state.postageMode} onValueChange={(val: any) => onChange('postageMode', val)}>
                                <SelectTrigger className="h-8 mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="first">First Class (£1.70)</SelectItem>
                                    <SelectItem value="second">Second Class (£0.87)</SelectItem>
                                    <SelectItem value="contract">Commercial (£0.50)</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {state.postageMode === 'manual' && (
                            <div>
                                <Label className="text-xs">Manual Postage (£)</Label>
                                <Input
                                    type="number"
                                    step={0.01}
                                    value={state.manualPostagePounds}
                                    onChange={(e) => onChange('manualPostagePounds', parseFloat(e.target.value) || 0)}
                                    className="font-mono h-8 mt-1"
                                />
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between">
                                <Label className="text-xs">Labour uplift (%)</Label>
                                <span className="text-xs font-mono font-bold">{state.labourPct}%</span>
                            </div>
                            <Slider
                                className="mt-2"
                                value={[state.labourPct]}
                                min={0}
                                max={50}
                                step={1}
                                onValueChange={(vals: number[]) => onChange('labourPct', vals[0])}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pl-2 border-l-2 border-muted ml-1">
                        <div>
                            <Label className="text-xs">Notify Class</Label>
                            <Select value={state.notifyLetterClass} onValueChange={(val: any) => onChange('notifyLetterClass', val)}>
                                <SelectTrigger className="h-8 mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="first">1st Class (68p)</SelectItem>
                                    <SelectItem value="second">2nd Class (59p)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-border my-6" />

            {/* SMS Pricing */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                    SMS Pricing
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Free Allowance</Label>
                        <Input
                            type="number"
                            value={state.smsAllowance}
                            onChange={(e) => onChange('smsAllowance', parseInt(e.target.value) || 0)}
                            className="font-mono h-8 mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Rate (p) after free</Label>
                        <Input
                            type="number"
                            step={0.01}
                            value={state.smsRatePence}
                            onChange={(e) => onChange('smsRatePence', parseFloat(e.target.value) || 0)}
                            className="font-mono h-8 mt-1"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-xs">VAT %</Label>
                    <Input
                        type="number"
                        value={state.vatPct}
                        onChange={(e) => onChange('vatPct', parseFloat(e.target.value) || 0)}
                        className="font-mono h-8 mt-1"
                    />
                </div>
            </div>

            <div className="h-px bg-border my-6" />

            {/* Overheads */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Optional Overheads
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Hosting (£/mo)</Label>
                        <Input
                            type="number"
                            step={0.01}
                            value={state.hostingMonthly}
                            onChange={(e) => onChange('hostingMonthly', parseFloat(e.target.value) || 0)}
                            className="font-mono h-8 mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Allocation</Label>
                        <Select value={state.overheadAllocMode} onValueChange={(val: any) => onChange('overheadAllocMode', val)}>
                            <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="per_run">Alloc per run</SelectItem>
                                <SelectItem value="per_year">Annual total</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Label className="text-xs">Include Domain (£{state.domainAnnual}/yr)?</Label>
                    <Switch checked={state.includeDomain} onCheckedChange={(val) => onChange('includeDomain', val)} />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Include Maintenance (£{state.maintenanceAnnual}/yr)?</Label>
                    <Switch checked={state.includeMaintenance} onCheckedChange={(val) => onChange('includeMaintenance', val)} />
                </div>
            </div>

            <div className="h-px bg-border my-6" />

            {/* Carbon */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2C8 7 6 10 6 13a6 6 0 0 0 12 0c0-3-2-6-6-11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                    Carbon Assumptions
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Letter (gCO2e)</Label>
                        <Input
                            type="number"
                            step={0.1}
                            value={state.letterCO2g}
                            onChange={(e) => onChange('letterCO2g', parseFloat(e.target.value) || 0)}
                            className="font-mono h-8 mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">SMS (gCO2e)</Label>
                        <Input
                            type="number"
                            step={0.001}
                            value={state.smsCO2g}
                            onChange={(e) => onChange('smsCO2g', parseFloat(e.target.value) || 0)}
                            className="font-mono h-8 mt-1"
                        />
                    </div>
                </div>
            </div>


        </Card>
    )
}
