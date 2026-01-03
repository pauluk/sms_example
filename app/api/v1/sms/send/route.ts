import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKey, smsLog, systemConfig, user } from "@/lib/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NotifyClient } from "notifications-node-client";
import { GLOBAL_TEMPLATE_ID } from "@/config/teams";

const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER;
const NOTIFY_API_KEY = process.env.NOTIFY_API_KEY;

export async function POST(req: NextRequest) {
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

        const validKey = keyRecord[0];

        // 2a. Rate Limit Check
        const limitConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'rate_limit_per_hour'));
        const limit = parseInt(limitConfig[0]?.value || "100");

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Count usage
        const usage = await db.select({ count: sql<number>`count(*)` })
            .from(smsLog)
            .where(and(
                eq(smsLog.userId, validKey.userId || ""),
                eq(smsLog.teamId, 'API_EXTERNAL'),
                gt(smsLog.sentAt, oneHourAgo)
            ));

        const currentUsage = Number(usage[0]?.count || 0);

        if (currentUsage >= limit) {
            return NextResponse.json({ error: `Rate limit exceeded. Max ${limit} messages per hour.` }, { status: 429 });
        }

        // 3. Update Last Used
        await db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, validKey.id));

        // 4. Parse Body
        const body = await req.json();
        const { message, phoneNumber } = body;

        if (!message || !phoneNumber) {
            return NextResponse.json({ error: "Missing required fields: message, phoneNumber" }, { status: 400 });
        }

        // 5. System Configuration Check (Live vs Test)
        const configRecord = await db.select().from(systemConfig).where(eq(systemConfig.key, 'enable_live_sms'));
        const isLiveMode = configRecord[0]?.value === 'true';

        let recipient = "";
        if (isLiveMode) {
            recipient = phoneNumber;
        } else {
            if (!TEST_PHONE_NUMBER) {
                return NextResponse.json({ error: "Configuration Error: TEST_PHONE_NUMBER not set on server" }, { status: 500 });
            }
            recipient = TEST_PHONE_NUMBER;
        }

        // 6. Send SMS via Notify
        if (!NOTIFY_API_KEY) {
            return NextResponse.json({ error: "Server Configuration Error: Missing NOTIFY_API_KEY" }, { status: 500 });
        }

        const notifyClient = new NotifyClient(NOTIFY_API_KEY);

        try {
            await notifyClient.sendSms(GLOBAL_TEMPLATE_ID, recipient, {
                personalisation: {
                    message: message
                }
            });
        } catch (notifyError: any) {
            console.error("Notify API Error:", notifyError);
            // Log failure
            await db.insert(smsLog).values({
                id: nanoid(),
                teamId: 'API_EXTERNAL', // Indicating external API usage
                userId: validKey.userId, // Link to the admin who owned the key
                message,
                recipient,
                status: 'failed',
                sentAt: new Date(),
            });
            return NextResponse.json({ error: "Failed to send SMS via provider" }, { status: 502 });
        }

        // 7. Log Success
        await db.insert(smsLog).values({
            id: nanoid(),
            teamId: 'API_EXTERNAL',
            userId: validKey.userId,
            message,
            recipient,
            status: 'sent',
            sentAt: new Date(),
        });

        return NextResponse.json({ success: true, status: 'sent', mode: isLiveMode ? 'live' : 'test' });

    } catch (error: any) {
        console.error("External SMS API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
