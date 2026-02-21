import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if we are trying to access an /admin route (except login)
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
        // Check for our mock cookie
        const hasMockSession = request.cookies.get('mock_logged_in');

        if (!hasMockSession) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // If going to login but already authenticated, redirect to admin dashboard
    if (request.nextUrl.pathname === '/admin/login') {
        const hasMockSession = request.cookies.get('mock_logged_in');
        if (hasMockSession) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
