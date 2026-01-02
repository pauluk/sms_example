
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

    const percentageUsed = Math.min(100, Math.round((metrics.monthlyUsage / metrics.quota) * 100));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage & Quota</h1>
                <p className="text-muted-foreground">
                    Monitor SMS usage and remaining quota for the current month.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Monthly Usage
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.monthlyUsage.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            messages sent this month
                        </p>
                        <Progress value={percentageUsed} className="mt-4" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {percentageUsed}% of quota used
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
                        <div className="text-2xl font-bold">{metrics.monthlyRemaining.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            messages available
                        </p>
                        <p className="text-xs text-muted-foreground mt-6">
                            Total Quota: {metrics.quota.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Projected Usage
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.estimatedusage.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            estimated by month end
                        </p>
                        <p className="text-xs text-muted-foreground mt-6">
                            Based on current daily average
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Total Lifetime Usage</CardTitle>
                    <CardDescription>
                        Total messages sent since system inception.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{metrics.totalSent.toLocaleString()}</div>
                </CardContent>
            </Card>
        </div>
    );
}
