
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemConfig } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        // Allow public read or restricted? 
        // Signup page needs to know the restriction to show UI hints, but maybe we just hardcode the hint "Allowed domains: X" 
        // OR we make a public endpoint for "signup-config".
        // Use case: Admin Settings page needs to read it.

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'allowed_domains'));
        const allowedDomains = config[0]?.value || '';

        const smsConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'enable_live_sms'));
        const enableLiveSms = smsConfig[0]?.value === 'true';

        const quotaConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'sms_quota'));
        const smsQuota = parseInt(quotaConfig[0]?.value || '30000');

        const visibilityConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_usage_to_teams'));
        const showUsageToTeams = visibilityConfig[0]?.value === 'true';

        const storiesConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_user_stories_to_teams'));
        const showUserStoriesToTeams = storiesConfig[0]?.value === 'true';

        const maintenanceConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'maintenance_mode'));
        const maintenanceMode = maintenanceConfig[0]?.value === 'true';

        const gdprAdminConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_admin'));
        const showGdprToAdmin = gdprAdminConfig[0]?.value !== 'false'; // Default true

        const gdprTeamsConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_teams'));
        const showGdprToTeams = gdprTeamsConfig[0]?.value === 'true'; // Default false

        return NextResponse.json({
            allowedDomains,
            enableLiveSms,
            smsQuota,
            showUsageToTeams,
            showUserStoriesToTeams,
            maintenanceMode,
            showGdprToAdmin,
            showGdprToTeams
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const {
            allowedDomains,
            enableLiveSms,
            smsQuota,
            showUsageToTeams,
            showUserStoriesToTeams,
            maintenanceMode,
            showGdprToAdmin,
            showGdprToTeams
        } = body;

        if (allowedDomains !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'allowed_domains', value: allowedDomains })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: allowedDomains, updatedAt: new Date() } });
        }

        if (enableLiveSms !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'enable_live_sms', value: String(enableLiveSms) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(enableLiveSms), updatedAt: new Date() } });
        }

        if (smsQuota !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'sms_quota', value: String(smsQuota) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(smsQuota), updatedAt: new Date() } });
        }

        if (showUsageToTeams !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'show_usage_to_teams', value: String(showUsageToTeams) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(showUsageToTeams), updatedAt: new Date() } });
        }
        if (showUserStoriesToTeams !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'show_user_stories_to_teams', value: String(showUserStoriesToTeams) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(showUserStoriesToTeams), updatedAt: new Date() } });
        }

        if (maintenanceMode !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'maintenance_mode', value: String(maintenanceMode) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(maintenanceMode), updatedAt: new Date() } });
        }

        if (showGdprToAdmin !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'show_gdpr_to_admin', value: String(showGdprToAdmin) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(showGdprToAdmin), updatedAt: new Date() } });
        }

        if (showGdprToTeams !== undefined) {
            await db.insert(systemConfig)
                .values({ key: 'show_gdpr_to_teams', value: String(showGdprToTeams) })
                .onConflictDoUpdate({ target: systemConfig.key, set: { value: String(showGdprToTeams), updatedAt: new Date() } });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
