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

        // 3. Maintenance check
        if (maintenanceMode) {
            // Check if session is admin
            // Fetch session from Better Auth API
            const sessionUrl = new URL('/api/auth/get-session', request.url);
            const sessionRes = await fetch(sessionUrl, {
                headers: {
                    cookie: request.headers.get('cookie') || ''
                }
            });
            const session = await sessionRes.json();

            if (!session || session.user.role !== 'admin') {
                return NextResponse.redirect(new URL('/maintenance', request.url));
            }
        } else {
            // 4. Role-based Access Control (GDPR)
            // We need to check session for GDPR users accessing non-GDPR dashboard routes
            if (pathname.startsWith('/dashboard')) {
                const sessionUrl = new URL('/api/auth/get-session', request.url);
                const sessionRes = await fetch(sessionUrl, {
                    headers: {
                        cookie: request.headers.get('cookie') || ''
                    }
                });
                const session = await sessionRes.json();

                if (session && session.user.role === 'gdpr') {
                    // Allow only /dashboard/gdpr
                    if (!pathname.startsWith('/dashboard/gdpr')) {
                        return NextResponse.redirect(new URL('/dashboard/gdpr', request.url));
                    }
                }
            }
        }

    } catch (error) {
        console.error("Middleware error:", error);
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
