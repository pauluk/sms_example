
import { NextRequest, NextResponse } from 'next/server';
import { NotifyClient } from 'notifications-node-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GLOBAL_TEMPLATE_ID } from '@/config/teams';
import { db } from '@/lib/db';
import { smsLog } from '@/lib/schema';
import { nanoid } from 'nanoid';

const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER;
const NOTIFY_API_KEY = process.env.NOTIFY_API_KEY;

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, scheduledFor, teamId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Enforce Test Mode
        const recipient = TEST_PHONE_NUMBER;
        if (!recipient) {
            return NextResponse.json({ error: "Configuration Error: TEST_PHONE_NUMBER not set" }, { status: 500 });
        }

        const isScheduled = !!scheduledFor;
        const status = isScheduled ? 'scheduled' : 'sent';
        const sentAt = isScheduled ? null : new Date();

        // If NOT scheduled, send immediately via Notify
        if (!isScheduled) {
            if (!NOTIFY_API_KEY) {
                return NextResponse.json({ error: "Server Configuration Error: Missing NOTIFY_API_KEY" }, { status: 500 });
            }

            const notifyClient = new NotifyClient(NOTIFY_API_KEY);
            await notifyClient.sendSms(GLOBAL_TEMPLATE_ID, recipient, {
                personalisation: {
                    message: message
                }
            });
        }

        // Log to Database (Audit Trail)
        await db.insert(smsLog).values({
            id: nanoid(),
            teamId: teamId || 'unknown',
            userId: session?.user?.id,
            message,
            recipient,
            status,
            scheduledFor: isScheduled ? new Date(scheduledFor) : null,
            sentAt,
        });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error("SMS Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send SMS" }, { status: 500 });
    }
}
