
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { smsLog, systemConfig } from '@/lib/schema';
import { count, eq, gte, lte, sql } from 'drizzle-orm';
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

        // 1. Permissions & Config
        const visibilityConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_usage_to_teams'));
        const showUsageToTeams = visibilityConfig[0]?.value === 'true';

        if (session.user.role !== 'admin' && !showUsageToTeams) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const quotaConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'sms_quota'));
        const annualQuota = parseInt(quotaConfig[0]?.value || '30000');

        // 2. Determine Financial Year (April 1st - March 31st)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0 = Jan, 3 = April

        // If currently Jan-March (0-2), start of FY was April of previous year
        const startOfFYYear = currentMonth < 3 ? currentYear - 1 : currentYear;
        const startOfFY = new Date(startOfFYYear, 3, 1); // April 1st
        const endOfFY = new Date(startOfFYYear + 1, 3, 0); // March 31st next year

        // 3. Get Total Usage for this Financial Year
        // Ideally use Drizzle's date functions, but for compatibility let's just use GTE
        const usageResult = await db.select({ count: count() })
            .from(smsLog)
            .where(
                gte(smsLog.createdAt, startOfFY)
            );

        const totalUsedFY = usageResult[0].count;

        // 4. Calculate Monthly Breakdown & Forecast
        // We need data for each month: April, May, ..., March
        // Initialize 12 months buckets
        const months = [
            "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
        ];

        // This query might be expensive on huge datasets, but simple for now:
        // Group by month. SQLite/PG specific. Let's do raw SQL or just fetch all dates if small?
        // Better: count and group by month using sql template.

        // Using PostgreSQL date_trunc
        const monthlyData = await db.select({
            month: sql<string>`to_char(${smsLog.createdAt}, 'Mon')`,
            monthNum: sql<number>`extract(month from ${smsLog.createdAt})`,
            count: count()
        })
            .from(smsLog)
            .where(gte(smsLog.createdAt, startOfFY))
            .groupBy(sql`to_char(${smsLog.createdAt}, 'Mon'), extract(month from ${smsLog.createdAt})`);

        // Map results to our timeline
        const usageSeries = months.map(label => {
            const found = monthlyData.find(d => d.month === label);
            return {
                name: label,
                actual: found ? Number(found.count) : 0,
                projected: 0, // Fill later
                isFuture: false
            };
        });

        // Calculate Average Monthly Usage (based on passed FULL months)
        // If we are in April (index 0), passed months = 0? Or do we count current partial?
        // Let's use days passed in FY
        const msInDay = 1000 * 60 * 60 * 24;
        const daysPassedInFY = Math.ceil((now.getTime() - startOfFY.getTime()) / msInDay);
        const dailyAverage = totalUsedFY / Math.max(1, daysPassedInFY);

        // Project remaining months
        // Reset series to correctly reflect "Actual" vs "Projected"
        // For passed months: Actual = count, Projected = null
        // For current month: Actual = count, Projected = forecast total? 
        // Let's simplified visual: 
        // Bar chart with "Actual" stack and "Projected" stack? 

        // Let's just create a linear projection for the whole year based on current run rate
        const projectedTotalFY = Math.round(dailyAverage * 365);

        // Build Graph Data
        // Each data point: { name: 'Apr', actual: 120, projected: 120 } (past)
        // Future: { name: 'Nov', actual: null, projected: estimated_monthly_avg }

        const currentMonthIndex = (currentMonth < 3) ? currentMonth + 9 : currentMonth - 3;
        // Jan(0) -> 9 (10th month of FY)
        // April(3) -> 0 (1st month)

        const graphData = months.map((label, index) => {
            const found = monthlyData.find(d => d.month === label);
            const actualVal = found ? Number(found.count) : 0;

            if (index < currentMonthIndex) {
                // Past month
                return { name: label, actual: actualVal, projected: 0, full: actualVal };
            } else if (index === currentMonthIndex) {
                // Current month
                // Projected for rest of this month = (daysInMonth - currentDay) * dailyAvg
                // Simple projection for the Month:
                const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const currentDay = now.getDate();
                const monthProjection = Math.round(actualVal + ((actualVal / Math.max(currentDay, 1)) * (daysInCurrentMonth - currentDay)));

                return { name: label, actual: actualVal, projected: monthProjection - actualVal, full: monthProjection };
            } else {
                // Future month
                // Estimate = dailyAverage * 30.4 (approx days in month)
                const est = Math.round(dailyAverage * 30.4);
                return { name: label, actual: 0, projected: est, full: est };
            }
        });

        const accumulatedProjection = graphData.reduce((acc, curr) => acc + curr.full, 0);


        return NextResponse.json({
            quota: annualQuota,
            used: totalUsedFY,
            remaining: Math.max(0, annualQuota - totalUsedFY),
            projectedTotal: accumulatedProjection,
            graphData,
            financialYear: `${startOfFYYear}/${startOfFYYear + 1}`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
