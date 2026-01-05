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

interface BulkSMSRow {
  recipient: string;
  message: string;
  teamId?: string;
}

interface BulkSMSResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    row: number;
    recipient: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows, teamId } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No valid rows provided" }, { status: 400 });
    }

    // Validate configuration
    if (!NOTIFY_API_KEY) {
      return NextResponse.json({ error: "Server Configuration Error: Missing NOTIFY_API_KEY" }, { status: 500 });
    }

    // Check System Configuration for Mode
    const configRecord = await db.select().from(systemConfig).where(eq(systemConfig.key, 'enable_live_sms'));
    const isLiveMode = configRecord[0]?.value === 'true';
    const isTestMode = !isLiveMode;

    const notifyClient = new NotifyClient(NOTIFY_API_KEY);
    const results: BulkSMSResult = {
      success: true,
      total: rows.length,
      sent: 0,
      failed: 0,
      results: []
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as BulkSMSRow;
      const rowNumber = i + 1;

      try {
        // Validate row data
        if (!row.message || !row.message.trim()) {
          throw new Error('Message is required');
        }

        if (row.message.length > 160) {
          throw new Error('Message exceeds 160 character limit');
        }

        // In test mode, use TEST_PHONE_NUMBER, otherwise use provided recipient
        const recipient = isTestMode ? TEST_PHONE_NUMBER : row.recipient;

        if (!recipient) {
          throw new Error(isTestMode ? 'TEST_PHONE_NUMBER not configured' : 'Recipient is required');
        }

        // Determine effective team ID for this row (row specific > batch default)
        const effectiveTeamId = row.teamId || teamId || 'unknown';

        // Resolve Sender ID
        let smsSenderId = DEFAULT_SENDER_ID;
        const teamByKey = TEAMS[effectiveTeamId];
        const teamById = Object.values(TEAMS).find(t => t.id === effectiveTeamId);

        if (teamByKey?.smsSenderId) {
          smsSenderId = teamByKey.smsSenderId;
        } else if (teamById?.smsSenderId) {
          smsSenderId = teamById.smsSenderId;
        }

        // Send SMS via GOV.UK Notify
        await notifyClient.sendSms(GLOBAL_TEMPLATE_ID, recipient, {
          personalisation: {
            message: row.message
          },
          smsSenderId: smsSenderId
        });

        // Log to database
        await db.insert(smsLog).values({
          id: nanoid(),
          teamId: row.teamId || teamId || 'unknown',
          userId: session?.user?.id,
          message: row.message,
          recipient: recipient,
          status: 'sent',
          sentAt: new Date(),
          scheduledFor: null,
        });

        results.sent++;
        results.results.push({
          row: rowNumber,
          recipient: isTestMode ? `${recipient} (test mode)` : recipient,
          status: 'success'
        });

      } catch (error: any) {
        console.error(`Bulk SMS Error (Row ${rowNumber}):`, error);

        // Log failed attempt to database
        try {
          await db.insert(smsLog).values({
            id: nanoid(),
            teamId: row.teamId || teamId || 'unknown',
            userId: session?.user?.id,
            message: row.message || 'N/A',
            recipient: isTestMode ? TEST_PHONE_NUMBER || 'unknown' : row.recipient || 'unknown',
            status: 'failed',
            sentAt: new Date(),
            scheduledFor: null,
          });
        } catch (dbError) {
          console.error('Failed to log error to database:', dbError);
        }

        results.failed++;
        results.results.push({
          row: rowNumber,
          recipient: row.recipient || 'N/A',
          status: 'failed',
          error: error.message || 'Unknown error'
        });
      }

      // Small delay to avoid rate limiting (100ms between sends)
      if (i < rows.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Overall success only if all succeeded
    results.success = results.failed === 0;

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Bulk SMS Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to send bulk SMS",
      success: false,
      total: 0,
      sent: 0,
      failed: 0,
      results: []
    }, { status: 500 });
  }
}
