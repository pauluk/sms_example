
import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { user, systemConfig } from "@/lib/schema";
import { count, eq } from "drizzle-orm";
import { magicLink, admin } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const auth = betterAuth({
    appName: "Gov SMS App",
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    trustedOrigins: ["http://localhost:3000", "http://192.168.0.199:3000", "https://sms-example-omega.vercel.app", "https://poc.sms.risen108010.co.uk"],
    rateLimit: {
        window: 60,
        max: 100,
    },
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ url, user }) {
            try {
                console.log('Attempting to send password reset to:', user.email);
                const info = await transporter.sendMail({
                    from: process.env.FROM_NAME ? `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>` : process.env.FROM_EMAIL,
                    to: user.email,
                    subject: "Reset your password",
                    text: `Click the link to reset your password: ${url}`,
                    html: `<a href="${url}">Reset your password</a>`,
                });
                console.log('Password reset email sent successfully:', info.messageId);
            } catch (error) {
                console.error('Failed to send password reset email:', error);
                throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, token, url }) => {
                try {
                    console.log('Attempting to send magic link to:', email);
                    const info = await transporter.sendMail({
                        from: process.env.FROM_NAME ? `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>` : process.env.FROM_EMAIL,
                        to: email,
                        subject: "Sign in to Gov SMS App",
                        text: `Click the link to sign in: ${url}`,
                        html: `<a href="${url}">Sign in to Gov SMS App</a>`,
                    });
                    console.log('Magic link sent successfully:', info.messageId);
                } catch (error) {
                    console.error('Failed to send magic link:', error);
                    throw new Error(`Failed to send magic link: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        }),
        admin(),
        passkey(),
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false
            },
            teamId: {
                type: "string",
                required: true,
                input: true // Allow input during signup
            }
        }
    },
    // hooks: {
    //     after: {
    //         signUp: async({ user: createdUser }) => {
    //             try {
    //                 const users = await db.select({ count: count() }).from(user);
    //                 // If count is 1, it means this is the first user (already inserted)
    //                 if (users[0].count === 1) {
    //                     await db.update(user).set({ role: 'admin' }).where(eq(user.id, createdUser.id));
    //                     console.log(`Assigned admin role to first user: ${createdUser.email}`);
    //                 }
    //             } catch (e) {
    //                 console.error("Failed to assign admin role:", e);
    //             }
    //         }
    //     }
    // }
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'allowed_domains'));
                    const allowed = config[0]?.value?.split(',').map(d => d.trim()).filter(Boolean);

                    if (allowed && allowed.length > 0) {
                        const emailDomain = user.email.split('@')[1];
                        const isAllowed = allowed.some(domain => emailDomain.endsWith(domain));
                        if (!isAllowed) {
                            throw new Error(`Email domain not allowed. Allowed: ${allowed.join(', ')}`);
                        }
                    }
                    return { data: user };
                }
            }
        }
    },
});
