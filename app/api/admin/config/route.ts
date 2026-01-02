
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
        const value = config[0]?.value || '';

        return NextResponse.json({ allowedDomains: value });
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
        const { allowedDomains } = body;

        await db.insert(systemConfig)
            .values({ key: 'allowed_domains', value: allowedDomains })
            .onConflictDoUpdate({ target: systemConfig.key, set: { value: allowedDomains, updatedAt: new Date() } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
