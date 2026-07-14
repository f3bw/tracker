'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as db from './db';
import type { Sport } from './db';
import { parseFit, type ParsedFit } from './fit';
import { SESSION_COOKIE, signSession } from './auth';
import { currentUserId } from './current-user';
import { verifyPassword } from './password';

function num(form: FormData, key: string): number | null {
    const v = form.get(key);
    return v === null || v === '' ? null : Number(v);
}

// ponytail: in-memory rate limit, per server instance — plenty for a handful of
// users; move failures to the db if instances ever multiply enough to matter
const loginFailures: number[] = [];

export async function login(form: FormData) {
    const now = Date.now();
    while (loginFailures.length && now - loginFailures[0] > 60_000) loginFailures.shift();
    if (loginFailures.length >= 5) redirect('/login?error=locked');

    const user = await db.getUserByUsername(String(form.get('username') ?? '').trim());
    if (!user || !verifyPassword(String(form.get('password') ?? ''), user.password_hash)) {
        loginFailures.push(now);
        redirect('/login?error=1');
    }
    (await cookies()).set(SESSION_COOKIE, await signSession(user.id), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90,
        path: '/',
    });
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
        const parsed = await parseFit(buf);
        // original file rides along so saving keeps a lossless copy
        parsed.fit_b64 = buf.toString('base64');
        return { parsed };
    } catch (e) {
        return { error: `could not parse fit file: ${e instanceof Error ? e.message : e}` };
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
