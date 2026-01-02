
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { smsLog, user, systemConfig } from '@/lib/schema';
import { eq, like, desc } from 'drizzle-orm';
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

        // Check Permissions based on Config
        const isAdmin = session.user.role === 'admin';

        let isAllowed = false;

        if (isAdmin) {
            const adminConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_admin'));
            isAllowed = adminConfig[0]?.value !== 'false'; // Default TRUE for admins
        } else {
            const teamConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'show_gdpr_to_teams'));
            isAllowed = teamConfig[0]?.value === 'true'; // Default FALSE for teams
        }

        if (!isAllowed) {
            return NextResponse.json({ error: "Access Denied: GDPR Search is disabled for your role." }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const mobile = searchParams.get('mobile');

        if (!mobile) {
            return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
        }

        // Sanitize: Remove spaces and non-numeric chars (keeping + if needed, but for "last 10 digits" we mostly care about digits)
        const cleanedMobile = mobile.replace(/\s+/g, '');

        // Logic: specific request "look for the last 10 digits"
        // We will strip everything except digits first to be safe, then take last 10.
        const digitsOnly = cleanedMobile.replace(/\D/g, '');
        const searchTerm = digitsOnly.slice(-10);

        if (searchTerm.length < 5) {
            return NextResponse.json({ error: "Search term too short (min 5 digits)" }, { status: 400 });
        }

        // Perform search
        const logs = await db.select({
            id: smsLog.id,
            message: smsLog.message,
            recipient: smsLog.recipient,
            status: smsLog.status,
            sentAt: smsLog.sentAt,
            teamId: smsLog.teamId,
            userName: user.name,
            userEmail: user.email,
        })
            .from(smsLog)
            .leftJoin(user, eq(smsLog.userId, user.id))
            .where(like(smsLog.recipient, `%${searchTerm}%`))
            .orderBy(desc(smsLog.sentAt));

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
