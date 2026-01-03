import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { systemConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { transporter } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { reason, info } = body;

        if (!reason || !info) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get Support Email
        const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'support_email'));
        const supportEmail = config[0]?.value || 'likewisedesign@gmail.com';

        // Send Email
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: supportEmail,
            replyTo: session.user.email,
            subject: `Access Request: ${reason} - ${session.user.email}`,
            text: `User: ${session.user.name} (${session.user.email})\nReason: ${reason}\n\nInformation:\n${info}`,
            html: `
                <h2>Access Request</h2>
                <p><strong>User:</strong> ${session.user.name} (<a href="mailto:${session.user.email}">${session.user.email}</a>)</p>
                <p><strong>Status:</strong> ${session.user.banned ? 'BANNED' : 'Active'}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <h3>Information:</h3>
                <p>${info.replace(/\n/g, '<br>')}</p>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to send support request:", error);
        return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
    }
}
