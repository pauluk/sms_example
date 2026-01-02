
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { team } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
    try {
        const allTeams = await db.select().from(team);
        return NextResponse.json({ teams: allTeams });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        const body = await req.json();
        const { id, manager, email } = body;

        if (!id || !manager || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updatedTeam = await db.update(team)
            .set({ manager, email, updatedAt: new Date() })
            .where(eq(team.id, id))
            .returning();

        return NextResponse.json({ success: true, team: updatedTeam[0] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
