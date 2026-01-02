
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { template } from '@/lib/schema';
import { auth } from '@/lib/auth'; // Adjust path
import { headers } from 'next/headers';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
        }

        const templates = await db.select().from(template).where(eq(template.teamId, teamId)).orderBy(desc(template.createdAt));
        return NextResponse.json({ templates });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, content, teamId } = body;

        if (!name || !content || !teamId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newTemplate = await db.insert(template).values({
            id: nanoid(),
            name,
            content,
            teamId,
            createdBy: session.user.id,
        }).returning();

        return NextResponse.json({ success: true, template: newTemplate[0] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
