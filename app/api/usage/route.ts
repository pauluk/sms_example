
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { smsLog, systemConfig } from '@/lib/schema';
import { count, eq, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get System Config
        const quotaConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'sms_quota'));
        const quota = parseInt(quotaConfig[0]?.value || '30000');

        const visibilityConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_usage_to_teams'));
        const showUsageToTeams = visibilityConfig[0]?.value === 'true';

        // Check permissions
        if (session.user.role !== 'admin' && !showUsageToTeams) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        // Calculate Usage
        // 1. Total Sent (All time)
        const totalResult = await db.select({ count: count() }).from(smsLog).where(eq(smsLog.status, 'sent'));
        const totalSent = totalResult[0].count;

        // 2. Current Month Usage
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentMonthResult = await db.select({ count: count() })
            .from(smsLog)
            .where(eq(smsLog.status, 'sent'))
        // Note: In a real app we'd add date filters here, but for now assuming all logs relevant or filtering in memory if DB is small. 
        // Correct Drizzle approach for date range:
        // .where(and(eq(smsLog.status, 'sent'), gte(smsLog.createdAt, startOfMonth), lte(smsLog.createdAt, endOfMonth)));

        // Since smsLog.createdAt is a timestamp, we can query it?
        // Let's refetch with date filter
        const currentMonthLogs = await db.select({ count: count() })
            .from(smsLog)
            .where(gte(smsLog.createdAt, startOfMonth));

        const currentMonthSent = currentMonthLogs[0].count;

        // 3. Estimate / Average
        // Simple estimation: Average per month based on total history duration? 
        // Or just project current month? 
        // Let's do a simple projection: (currentMonth / daysPassed) * daysInMonth
        const daysInMonth = endOfMonth.getDate();
        const daysPassed = now.getDate();
        const estimatedMonthEnd = Math.round((currentMonthSent / Math.max(daysPassed, 1)) * daysInMonth);

        return NextResponse.json({
            quota,
            totalSent,
            remaining: Math.max(0, quota - totalSent), // Or should quota be monthly? Usually quotas are monthly.
            // Requirement says "default to 30000. use that as a metric to show how many are available". 
            // Usually quotas reset monthly. Let's assume it's a MONTHLY quota for now as that's standard.
            // If it's a total lifetime quota, the math is quota - totalSent.
            // If monthly: quota - currentMonthSent.

            // Let's assume Monthly Quota based on "estimate usage ... in months" context.
            monthlyUsage: currentMonthSent,
            monthlyRemaining: Math.max(0, quota - currentMonthSent),
            estimatedusage: estimatedMonthEnd
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
