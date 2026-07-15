import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

export default async function proxy(request: NextRequest) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? '';
    if ((await verifySession(cookie)) !== null) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: ['/((?!$|login|signup|_next/static|_next/image|manifest.webmanifest|[^/]+\\.(?:png|svg|ico)).*)'],
};
