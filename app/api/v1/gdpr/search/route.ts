import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKey, smsLog } from "@/lib/schema";
import { eq, and, like, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // 1. Auth Check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing or invalid Bearer token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // 2. Validate Token
        const keyRecord = await db.select().from(apiKey).where(and(eq(apiKey.key, token), eq(apiKey.isActive, true)));

        if (!keyRecord || keyRecord.length === 0) {
            return NextResponse.json({ error: "Unauthorized: Invalid or inactive API key" }, { status: 401 });
        }

        // 3. Parse Query Params
        const { searchParams } = new URL(req.url);
        const number = searchParams.get('number');

        if (!number) {
            return NextResponse.json({ error: "Missing required parameter: number" }, { status: 400 });
        }

        // 4. Extract last 10 digits logic
        // Remove non-digit characters first to be safe, then take last 10
        const cleanNumber = number.replace(/\D/g, '');
        if (cleanNumber.length < 10) {
            return NextResponse.json({ error: "Invalid number format. Must provide at least 10 digits." }, { status: 400 });
        }
        const last10 = cleanNumber.slice(-10);

        // 5. Search SMS Log
        // We look for recipients ENDING with these 10 digits
        const records = await db.select({
            id: smsLog.id,
            teamId: smsLog.teamId,
            message: smsLog.message,
            recipient: smsLog.recipient,
            status: smsLog.status,
            sentAt: smsLog.sentAt,
            createdAt: smsLog.createdAt
        })
            .from(smsLog)
            .where(like(smsLog.recipient, `%${last10}`))
            .orderBy(desc(smsLog.createdAt))
            .limit(50); // Cap results for safety

        if (records.length === 0) {
            return NextResponse.json({ message: "No records existing for this number" }, { status: 404 });
        }

        return NextResponse.json({ results: records, count: records.length });

    } catch (error: any) {
        console.error("GDPR Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
