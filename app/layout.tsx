
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { systemConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gov SMS App",
  description: "Send SMS messages via GOV.UK Notify",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const path = headersList.get("x-invoke-path") || "";

  // Check Maintenance Mode
  const maintenanceConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'maintenance_mode'));
  const isMaintenance = maintenanceConfig[0]?.value === 'true';

  if (isMaintenance) {
    // Allow access to maintenance page and api routes (for login/auth)
    // Also allow root path '/' so they can see login screen (but redirection logic might happen there too?)
    // We want to block /dashboard for regular users.
    // If we block '/', admins can't login via UI.
    // So: Allow '/maintenance' and '/'.

    // Better strategy:
    // If path is NOT /maintenance
    // AND NOT /api/*
    // AND User is LOGGED IN
    // AND User is NOT ADMIN
    // -> Redirect to /maintenance

    // Note: We can't easily detect path in server component layout without middleware setting a header, 
    // but 'x-invoke-path' might rely on Vercel specifics. 
    // Safe generic way: use middleware? Or assume if we are rendering layout, we are checking.

    const session = await auth.api.getSession({
      headers: headersList
    });

    if (session && session.user.role !== 'admin') {
      // We need to redirect to /maintenance, but only if we aren't already there.
      // Since we can't easily check current path in Layout without middleware headers, we might loop.
      // However, /maintenance page uses a DIFFERENT layout? No, generic layout.
      // If we are in RootLayout, we effect everyone.

      // We need to opt-out the /maintenance page from this check OR ensure we don't redirect if already there.
      // BUT 'children' is rendered. 
      // If we can't check path, we can't implement this SAFELY in layout without middleware passing path.
    }
  }

  // REVISITING STRATEGY: 
  // Doing this in Layout is brittle without Middleware for path detection.
  // Let's implement MIDDLWARE.TS for this. It's the standard Next.js way.
  // But DB access in Edge? Better Auth uses Drizzle Adapter which supports Edge compatible drivers.
  // Our db.ts uses 'neon-http' which is HTTP based, so it IS Edge compatible! 
  // Let's abort layout change and create middleware.ts.

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
