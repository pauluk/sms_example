import { db } from "@/lib/db";
import { user, session } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            teamId: user.teamId,
            banned: user.banned,
            banReason: user.banReason,
            banExpires: user.banExpires,
            lastLogin: sql<Date>`MAX(${session.createdAt})`,
        })
        .from(user)
        .leftJoin(session, eq(session.userId, user.id))
        .groupBy(user.id)
        .orderBy(desc(user.createdAt));

    return NextResponse.json({ users: allUsers });
}

export async function PUT(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, role, teamId, banned } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await db.update(user)
            .set({
                role: role || 'user',
                teamId: teamId || null,
                banned: banned
            })
            .where(eq(user.id, userId));

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
