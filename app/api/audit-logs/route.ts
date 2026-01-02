
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { smsLog } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth'; // Adjust path
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
        }

        const logs = await db.select()
            .from(smsLog)
            .where(eq(smsLog.teamId, teamId))
            .orderBy(desc(smsLog.createdAt));

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
