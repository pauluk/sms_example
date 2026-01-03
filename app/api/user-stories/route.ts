import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userStory } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Retrieve sort/filter params usually, but for now we'll fetch all and let client handle complex sorting
        // or implement basic DB sorting here.
        const stories = await db.select().from(userStory).orderBy(asc(userStory.id));

        return NextResponse.json(stories);
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Note: Both 'user' and 'admin' can create stories now. Only 'admin' can update.


        const body = await req.json();
        const { role, feature, story, priority, status } = body;

        // Basic validation
        if (!role || !feature || !story || !priority || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newId = `US-${nanoid(6)}`; // Or auto-increment logic if preferred, but schema uses text ID

        const [newItem] = await db.insert(userStory).values({
            id: newId,
            role,
            feature,
            story,
            priority,
            status,
            acceptanceCriteria: body.acceptanceCriteria || null
        }).returning();

        return NextResponse.json(newItem);
    } catch (err) {
        return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { id, role, feature, story, priority, status, acceptanceCriteria } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const [updated] = await db.update(userStory)
            .set({
                role, feature, story, priority, status, acceptanceCriteria,
                updatedAt: new Date()
            })
            .where(eq(userStory.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: "Failed to update story" }, { status: 500 });
    }
}
