import assert from 'node:assert';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';

process.env.TURSO_DATABASE_URL = `file:${path.join(os.tmpdir(), `tracker-test-${process.pid}.db`)}`;

test('semicircles to degrees', async () => {
    const { semicirclesToDegrees } = await import('../src/lib/fit.ts');
    assert.equal(semicirclesToDegrees(2 ** 31), 180);
    assert.equal(semicirclesToDegrees(0), 0);
    // 624880556 semicircles ≈ 52.37688° (Amsterdam)
    assert.equal(semicirclesToDegrees(624880556), 52.37688);
    assert.equal(semicirclesToDegrees(-624880556), -52.37688);
});

test('downsample caps length and keeps endpoints region', async () => {
    const { downsample } = await import('../src/lib/fit.ts');
    const big = Array.from({ length: 5000 }, (_, i) => i);
    const small = downsample(big);
    assert.equal(small.length, 500);
    assert.equal(small[0], 0);
    assert.deepEqual(downsample([1, 2, 3]), [1, 2, 3]);
});

test('db activity round-trip, shoe totals, and per-user isolation', async () => {
    const db = await import('../src/lib/db.ts');
    const { hashPassword, verifyPassword } = await import('../src/lib/password.ts');
    const hash = hashPassword('pw');
    assert.ok(verifyPassword('pw', hash));
    assert.ok(!verifyPassword('wrong', hash));
    const userId = await db.insertUser('me', hash);
    const otherId = await db.insertUser('partner', hashPassword('pw2'));
    await db.insertShoe(userId, 'test shoe', 500);
    const shoe = (await db.listShoes(userId))[0];
    const id = await db.insertActivity(userId, {
        date: '2026-07-13',
        sport: 'run',
        duration_min: 42,
        distance_km: 8.5,
        notes: 'hello',
        shoe_id: shoe.id,
        route: JSON.stringify([[52.37, 4.89]]),
    });
    const a = await db.getActivity(id, userId);
    assert.equal(a?.distance_km, 8.5);
    assert.equal(a?.shoe_name, 'test shoe');
    assert.equal((await db.listShoes(userId))[0].total_km, 8.5);
    assert.equal((await db.listActivities(otherId)).length, 0);
    assert.equal(await db.getActivity(id, otherId), undefined);
    assert.equal((await db.listShoes(otherId)).length, 0);
    await assert.rejects(
        db.insertActivity(userId, {
            date: '2026-07-13',
            sport: 'curling' as never,
            duration_min: 1,
            distance_km: null,
            notes: null,
            shoe_id: null,
            route: null,
        }),
    );
    await db.deleteActivity(id, userId);
    assert.equal((await db.listActivities(userId)).length, 0);
});

test('session sign/verify round-trip, rejects tampering', async () => {
    process.env.SESSION_SECRET = 'test-secret';
    const { signSession, verifySession } = await import('../src/lib/auth.ts');
    const cookie = await signSession(7);
    assert.equal(await verifySession(cookie), 7);
    assert.equal(await verifySession(cookie.replace('7.', '8.')), null);
    assert.equal(await verifySession('garbage'), null);
    assert.equal(await verifySession(''), null);
});
