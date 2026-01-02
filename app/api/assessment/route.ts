
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Define schema locally since we aren't regenerating the main schema file yet
const serviceAssessment = pgTable("service_assessment", {
    id: text("id").primaryKey(),
    serviceName: text("service_name"),
    volumeEmail: integer("volume_email"),
    volumeSms: integer("volume_sms"),
    volumeLetter: integer("volume_letter"),
    isUnique: boolean("is_unique"),
    hasMinTeam: boolean("has_min_team"),
    hasTemplates: boolean("has_templates"),
    fromName: text("from_name"),
    replyToEmail: text("reply_to_email"),
    senderId: text("sender_id"),
    updatedAt: timestamp("updated_at"),
    updatedBy: text("updated_by"),
});

export async function GET(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.select().from(serviceAssessment).where(eq(serviceAssessment.id, 'default'));
    return NextResponse.json({ data: data[0] || {} });
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Upsert
    await db.insert(serviceAssessment).values({
        id: 'default',
        ...body,
        updatedAt: new Date(),
        updatedBy: session.user.id
    }).onConflictDoUpdate({
        target: serviceAssessment.id,
        set: {
            ...body,
            updatedAt: new Date(),
            updatedBy: session.user.id
        }
    });

    return NextResponse.json({ success: true });
}
