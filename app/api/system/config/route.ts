
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { systemConfig } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'allowed_domains'));
        const value = config[0]?.value || '';
        return NextResponse.json({ allowedDomains: value });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
