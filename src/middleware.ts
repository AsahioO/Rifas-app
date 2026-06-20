import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-server';

function getSupabaseAuthCookieNames(request: NextRequest) {
    return request.cookies
        .getAll()
        .map(cookie => cookie.name)
        .filter(name => name.startsWith('sb-') && name.includes('auth-token'));
}

function isInvalidRefreshTokenError(error: unknown) {
    if (!error || typeof error !== 'object') return false;

    const authError = error as { code?: string; message?: string; status?: number };
    const message = authError.message?.toLowerCase() ?? '';

    return authError.code === 'refresh_token_not_found'
        || authError.code === 'invalid_refresh_token'
        || (authError.status === 400 && message.includes('refresh token'));
}

function clearCookies(response: NextResponse, cookieNames: string[]) {
    cookieNames.forEach(name => {
        response.cookies.set(name, '', {
            path: '/',
            maxAge: 0,
        });
    });

    return response;
}

function copyCookies(from: NextResponse, to: NextResponse) {
    from.cookies.getAll().forEach(({ name, value, ...options }) => {
        to.cookies.set(name, value, options);
    });

    return to;
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === '/admin/login';
    const isProtectedAdminRoute = pathname.startsWith('/admin') && !isLoginPage;
    const authCookieNames = getSupabaseAuthCookieNames(request);

    if (authCookieNames.length === 0) {
        if (isProtectedAdminRoute) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        return NextResponse.next();
    }

    const { supabase, getResponse } = createSupabaseMiddlewareClient(request);

    // Validate the user server-side before allowing admin access.
    let user: User | null = null;
    let authError: unknown = null;

    try {
        const result = await supabase.auth.getUser();
        user = result.data.user;
        authError = result.error;
    } catch (error) {
        authError = error;
    }

    const shouldClearAuthCookies = isInvalidRefreshTokenError(authError);
    const supabaseResponse = shouldClearAuthCookies
        ? clearCookies(getResponse(), authCookieNames)
        : getResponse();

    // Protect /admin routes (except login)
    if (isProtectedAdminRoute) {
        if (!user) {
            const redirect = NextResponse.redirect(new URL('/admin/login', request.url));
            copyCookies(supabaseResponse, redirect);
            if (shouldClearAuthCookies) clearCookies(redirect, authCookieNames);
            return redirect;
        }
    }

    // If going to login but already authenticated, redirect to admin dashboard
    if (isLoginPage) {
        if (user) {
            const redirect = NextResponse.redirect(new URL('/admin', request.url));
            copyCookies(supabaseResponse, redirect);
            return redirect;
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/admin/:path*'],
};
