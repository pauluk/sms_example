
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { systemConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { text, maxChars } = await req.json();

        if (!text) {
            return new NextResponse("Text is required", { status: 400 });
        }

        const config = await db.query.systemConfig.findFirst({
            where: eq(systemConfig.key, 'geminiApiKey')
        });
        const apiKey = config?.value || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new NextResponse("Gemini API Key not configured", { status: 500 });
        }

        const prompt = `
        Role: You are an expert SMS copywriter for the UK Government.
        Task: Compress the following text into a single SMS message.
        Constraints:
        1. Maximum length: ${maxChars} characters.
        2. Tone: Professional yet accessible (Plain English).
        3. Localisation: MUST use UK English spelling (e.g., 'authorised' not 'authorized').
        4. Date Format: MUST use dd/MM/yyyy (e.g., 31/01/2025).
        5. Currency: MUST use GBP (£) symbol contextually if money is mentioned.
        6. Audience: Reframe for a broad audience (Grade 6 reading level), avoiding jargon.
        7. Structure: Optimize for SMS (Clear hook, immediate action).
        8. No markdown, no "Here is the message", just the raw SMS text.

        Input Text:
        "${text}"
        `.trim();

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API Error:", error);
            return new NextResponse("Failed to generate content", { status: 500 });
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return NextResponse.json({ text: generatedText.trim() });

    } catch (error) {
        console.error("Error in AI Compress:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
