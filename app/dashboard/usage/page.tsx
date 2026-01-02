
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function UsagePage() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isPending) {
            if (!session) {
                router.push("/");
                return;
            }
            fetchUsage();
        }
    }, [session, isPending, router]);

    const fetchUsage = async () => {
        try {
            const res = await fetch("/api/usage");
            if (res.status === 403) {
                setError("Access Denied: You do not have permission to view usage metrics.");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error(e);
            setError("Failed to load usage data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading metrics...</div>;
    if (error) return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );

    if (!metrics) return null;

    const percentageUsed = Math.min(100, Math.round((metrics.used / metrics.quota) * 100));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Financial Year Usage</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    April {metrics.financialYear.split('/')[0]} – March {metrics.financialYear.split('/')[1]}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Annual Usage
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.used.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            messages sent this year
                        </p>
                        <Progress value={percentageUsed} className="mt-4" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {percentageUsed}% of annual quota used
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Remaining Quota
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.remaining.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            messages available
                        </p>
                        <p className="text-xs text-muted-foreground mt-6">
                            Annual Limit: {metrics.quota.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Projected Total
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.projectedTotal.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            forecasted for end of financial year
                        </p>
                        <div className={`text-xs mt-6 font-medium ${metrics.projectedTotal > metrics.quota ? "text-red-600" : "text-green-600"}`}>
                            {metrics.projectedTotal > metrics.quota ?
                                `⚠️ on track to exceed quota by ${(metrics.projectedTotal - metrics.quota).toLocaleString()}` :
                                `✅ on track to stay within quota`
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage Forecast (Apr - Mar)</CardTitle>
                    <CardDescription>
                        Monthly breakdown with future projections based on current average usage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={metrics.graphData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: any, name: any) => [value?.toLocaleString() || "0", name === 'actual' ? 'Actual Sent' : 'Projected']}
                                    labelStyle={{ color: '#000' }}
                                />
                                <Legend />
                                <Bar dataKey="actual" name="Actual Usage" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="projected" name="Projected" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                                {/* Optional: Quota Line? Normalized to monthly? No, quota is annual. */}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
