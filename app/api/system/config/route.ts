
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemConfig } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'allowed_domains'));
        const value = config[0]?.value || '';

        const maintenanceConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'maintenance_mode'));
        const maintenanceMode = maintenanceConfig[0]?.value === 'true';

        const gdprAdminConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_admin'));
        const showGdprToAdmin = gdprAdminConfig[0]?.value !== 'false';

        const gdprTeamsConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_teams'));
        const showGdprToTeams = gdprTeamsConfig[0]?.value === 'true';

        return NextResponse.json({ allowedDomains: value, maintenanceMode, showGdprToAdmin, showGdprToTeams });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
