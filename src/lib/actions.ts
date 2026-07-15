'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as db from './db';
import type { Sport } from './db';
import { parseFit, type ParsedFit } from './fit';
import { parseGpx } from './gpx';
import { SESSION_COOKIE, signSession } from './auth';
import { currentUserId } from './current-user';
import { hashPassword, verifyPassword } from './password';

function num(form: FormData, key: string): number | null {
    const v = form.get(key);
    return v === null || v === '' ? null : Number(v);
}

// ponytail: in-memory rate limit, per server instance — plenty for a handful of
// users; move failures to the db if instances ever multiply enough to matter
const loginFailures: number[] = [];
const signupFailures: number[] = [];

function rateLimit(failures: number[], lockedUrl: string) {
    const now = Date.now();
    while (failures.length && now - failures[0] > 60_000) failures.shift();
    if (failures.length >= 5) redirect(lockedUrl);
}

async function setSession(userId: number) {
    (await cookies()).set(SESSION_COOKIE, await signSession(userId), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90,
        path: '/',
    });
}

export async function login(form: FormData) {
    rateLimit(loginFailures, '/login?error=locked');

    const user = await db.getUserByUsername(String(form.get('username') ?? '').trim());
    if (!user || !verifyPassword(String(form.get('password') ?? ''), user.password_hash)) {
        loginFailures.push(Date.now());
        redirect('/login?error=1');
    }
    await setSession(user.id);
    redirect('/');
}

export async function signup(form: FormData) {
    rateLimit(signupFailures, '/signup?error=locked');

    const invite = process.env.INVITE_CODE;
    if (!invite || form.get('invite') !== invite) {
        signupFailures.push(Date.now());
        redirect('/signup?error=invite');
    }
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!/^[\w.-]{1,30}$/.test(username) || password.length < 8) redirect('/signup?error=1');
    if (await db.getUserByUsername(username)) redirect('/signup?error=taken');

    const userId = await db.insertUser(username, hashPassword(password));
    await setSession(userId);
    redirect('/');
}

export async function logout() {
    (await cookies()).delete(SESSION_COOKIE);
    redirect('/login');
}

export async function saveActivity(form: FormData) {
    const userId = await currentUserId();
    const id = await db.insertActivity(userId, {
        date: String(form.get('date')),
        sport: String(form.get('sport')) as Sport,
        duration_min: Number(form.get('duration_min')),
        distance_km: num(form, 'distance_km'),
        notes: String(form.get('notes') ?? '') || null,
        shoe_id: num(form, 'shoe_id'),
        watch_id: num(form, 'watch_id'),
        route: String(form.get('route') ?? '') || null,
        metrics: String(form.get('metrics') ?? '') || null,
        series: String(form.get('series') ?? '') || null,
        laps: String(form.get('laps') ?? '') || null,
    });
    const fitB64 = String(form.get('fit_b64') ?? '');
    if (fitB64) await db.insertFit(id, Buffer.from(fitB64, 'base64'));
    revalidatePath('/');
    redirect(`/activities/${id}`);
}

export async function changeGear(form: FormData) {
    const id = Number(form.get('id'));
    await db.updateActivityGear(
        id,
        await currentUserId(),
        num(form, 'shoe_id'),
        num(form, 'watch_id'),
    );
    revalidatePath(`/activities/${id}`);
    redirect(`/activities/${id}`);
}

export async function removeActivity(form: FormData) {
    await db.deleteActivity(Number(form.get('id')), await currentUserId());
    revalidatePath('/');
    redirect('/');
}

export async function addGear(form: FormData) {
    const name = String(form.get('name') ?? '').trim();
    const kind = form.get('kind') === 'watch' ? 'watch' : 'shoe';
    if (name) await db.insertGear(await currentUserId(), kind, name, num(form, 'threshold_km'));
    revalidatePath('/gear');
}

export async function parseFitFile(
    _prev: { parsed?: ParsedFit; error?: string } | null,
    form: FormData,
): Promise<{ parsed?: ParsedFit; error?: string }> {
    const file = form.get('fit');
    if (!(file instanceof File) || file.size === 0) return { error: 'no file' };
    try {
        const buf = Buffer.from(await file.arrayBuffer());
        const parsed = file.name.toLowerCase().endsWith('.gpx')
            ? parseGpx(buf.toString('utf-8'))
            : await parseFit(buf);
        // original file rides along so saving keeps a lossless copy
        parsed.fit_b64 = buf.toString('base64');
        return { parsed };
    } catch (e) {
        return { error: `could not parse file: ${e instanceof Error ? e.message : e}` };
    }
}

export async function removeGear(form: FormData) {
    await db.deleteGear(Number(form.get('id')), await currentUserId());
    revalidatePath('/gear');
}

export async function makeDefaultGear(form: FormData) {
    await db.setDefaultGear(Number(form.get('id')), await currentUserId());
    revalidatePath('/gear');
}
