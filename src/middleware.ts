import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server';

export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(request);

    // Validate the user server-side before allowing admin access.
    const { data: { user } } = await supabase.auth.getUser();

    // Protect /admin routes (except login)
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // If going to login but already authenticated, redirect to admin dashboard
    if (request.nextUrl.pathname === '/admin/login') {
        if (user) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};
