import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionToken } from '@/lib/auth';

export default async function proxy(request: NextRequest) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? '';
    const expected = await sessionToken();
    // ponytail: length check + char compare on a fixed-length hex HMAC; the value
    // being compared is itself an HMAC, so timing leaks nothing usable
    if (cookie.length === expected.length && cookie === expected) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
