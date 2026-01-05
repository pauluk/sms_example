import { NextRequest, NextResponse } from 'next/server';
import { NotifyClient } from 'notifications-node-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { GLOBAL_TEMPLATE_ID, DEFAULT_SENDER_ID, TEAMS } from '@/config/teams';
import { db } from '@/lib/db';
import { smsLog, systemConfig } from '@/lib/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

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

        const { message, scheduledFor, teamId, recipient: reqRecipient } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Determine Recipient based on System Configuration
        const configRecord = await db.select().from(systemConfig).where(eq(systemConfig.key, 'enable_live_sms'));
        const isLiveMode = configRecord[0]?.value === 'true';

        let recipient = '';

        if (isLiveMode) {
            if (!reqRecipient) {
                return NextResponse.json({ error: "Recipient is required in Live Mode" }, { status: 400 });
            }
            recipient = reqRecipient;
        } else {
            if (!TEST_PHONE_NUMBER) {
                return NextResponse.json({ error: "Configuration Error: TEST_PHONE_NUMBER not set" }, { status: 500 });
            }
            recipient = TEST_PHONE_NUMBER;
        }

        const isScheduled = !!scheduledFor;
        const status = isScheduled ? 'scheduled' : 'sent';
        const sentAt = isScheduled ? null : new Date();

        // If NOT scheduled, send immediately via Notify
        if (!isScheduled) {
            if (!NOTIFY_API_KEY) {
                return NextResponse.json({ error: "Server Configuration Error: Missing NOTIFY_API_KEY" }, { status: 500 });
            }

            // Determine Sender ID (Branding)
            // Logic: 1. Try Key lookup, 2. Try ID lookup, 3. Fallback to Default
            let smsSenderId = DEFAULT_SENDER_ID;
            const teamByKey = TEAMS[teamId];
            const teamById = Object.values(TEAMS).find(t => t.id === teamId);

            if (teamByKey?.smsSenderId) {
                smsSenderId = teamByKey.smsSenderId;
            } else if (teamById?.smsSenderId) {
                smsSenderId = teamById.smsSenderId;
            }



            const notifyClient = new NotifyClient(NOTIFY_API_KEY);
            await notifyClient.sendSms(GLOBAL_TEMPLATE_ID, recipient, {
                personalisation: {
                    message: message
                },
                smsSenderId: smsSenderId
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
