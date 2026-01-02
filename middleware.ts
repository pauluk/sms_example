import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip if already on maintenance page or api routes or static files
    if (
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') || // static files usually
        pathname === '/' // Allow login page always
    ) {
        return NextResponse.next();
    }

    try {
        // 2. Check Maintenance Mode status
        // We use an internal fetch to our API (must provide absolute URL)
        const sysConfigUrl = new URL('/api/system/config', request.url);
        const configRes = await fetch(sysConfigUrl);
        const { maintenanceMode } = await configRes.json();

        if (maintenanceMode) {
            // 3. If Maintenance is ON, we need to check if user is Admin.
            // Accessing DB directly here is risky/hard in edge.
            // We can check the session cookie exists, but validating role requires a fetch to /api/auth/get-session 
            // OR simpler:
            // If we just block everyone from /dashboard when maintenance is on, except those with a special cookie? No.
            // We generally want Admins to be able to access.

            // Better Auth doesn't have a simple synchronous middleware check without DB.
            // We can use 'better-auth/middleware' if we were using the plugin, but we're manual here.

            // Strategy:
            // Fetch session from Better Auth API
            const sessionUrl = new URL('/api/auth/get-session', request.url);
            // We need to pass the cookie header
            const sessionRes = await fetch(sessionUrl, {
                headers: {
                    cookie: request.headers.get('cookie') || ''
                }
            });
            const session = await sessionRes.json();

            if (!session || session.user.role !== 'admin') {
                return NextResponse.redirect(new URL('/maintenance', request.url));
            }
        }
    } catch (error) {
        console.error("Middleware error:", error);
        // Fail open or closed? Fail open to avoid blocking due to error options.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
