import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKey } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hashKey } from "@/lib/crypto";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const keys = await db.select()
        .from(apiKey)
        .orderBy(desc(apiKey.createdAt));

    return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const rawKey = `sk_live_${nanoid(32)}`;
    const hashedKey = hashKey(rawKey);

    await db.insert(apiKey).values({
        id: nanoid(),
        name,
        key: hashedKey, // Store the hash
        userId: session.user.id,
    });

    // Return the RAW key to the user (first and last time)
    return NextResponse.json({ success: true, key: rawKey });
}

export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.delete(apiKey).where(eq(apiKey.id, id));

    return NextResponse.json({ success: true });
}
