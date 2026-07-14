import assert from 'node:assert';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';

process.env.TURSO_DATABASE_URL = `file:${path.join(os.tmpdir(), `tracker-test-${process.pid}.db`)}`;

test('extractMetrics: scalars, pace conversion, run cadence doubling, omissions', async () => {
    const { extractMetrics } = await import('../src/lib/fit.ts');
    const session = {
        total_ascent: 0.123, // km (lengthUnit conversion) -> 123 m
        total_calories: 456,
        avg_heart_rate: 150.4,
        max_heart_rate: 172,
        avg_cadence: 85, // per leg -> 170 for run
    };
    const records = [
        { enhanced_altitude: 0.01, heart_rate: 140, speed: 3.333, cadence: 84 },
        { enhanced_altitude: 0.012, heart_rate: 150, speed: 2.777, cadence: 86 },
        { enhanced_altitude: 0.011, heart_rate: 155, speed: 0.1, cadence: 85 }, // standing still: no pace point
    ];
    const { metrics, series } = extractMetrics(session, records, 'run');
    assert.deepEqual(metrics, {
        ascent_m: 123,
        calories: 456,
        avg_hr: 150,
        max_hr: 172,
        avg_cadence: 170,
    });
    assert.deepEqual(series?.alt, [10, 12, 11]);
    assert.deepEqual(series?.hr, [140, 150, 155]);
    assert.deepEqual(series?.pace, [5, 6]); // 3.333 m/s = 5:00/km, 2.777 = 6:00/km
    assert.deepEqual(series?.cad, [168, 172, 170]);
    // ride cadence stays raw; empty input -> nulls
    const ride = extractMetrics({ avg_cadence: 90 }, [], 'ride');
    assert.equal(ride.metrics?.avg_cadence, 90);
    assert.equal(ride.series, null);
    assert.deepEqual(extractMetrics({}, [], 'run'), { metrics: null, series: null });
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
    await db.insertGear(userId, 'shoe', 'test shoe', 500);
    await db.insertGear(userId, 'watch', 'test watch', null);
    const [shoe, watch] = await db.listGear(userId);
    assert.equal(shoe.kind, 'shoe');
    assert.equal(watch.kind, 'watch');
    const id = await db.insertActivity(userId, {
        date: '2026-07-13',
        sport: 'run',
        duration_min: 42,
        distance_km: 8.5,
        notes: 'hello',
        shoe_id: shoe.id,
        watch_id: watch.id,
        route: JSON.stringify([[52.37, 4.89]]),
        metrics: JSON.stringify({ ascent_m: 12 }),
        series: JSON.stringify({ hr: [140, 150] }),
    });
    const a = await db.getActivity(id, userId);
    assert.equal(a?.distance_km, 8.5);
    assert.deepEqual(JSON.parse(a!.metrics!), { ascent_m: 12 });
    assert.deepEqual(JSON.parse(a!.series!), { hr: [140, 150] });
    assert.equal(a?.shoe_name, 'test shoe');
    assert.equal(a?.watch_name, 'test watch');
    const gear = await db.listGear(userId);
    assert.equal(gear[0].total_km, 8.5);
    assert.equal(gear[1].total_min, 42);
    await db.updateActivityGear(id, userId, null, null);
    assert.equal((await db.getActivity(id, userId))?.shoe_name, null);
    await db.updateActivityGear(id, userId, shoe.id, watch.id);
    assert.equal((await db.getActivity(id, userId))?.shoe_name, 'test shoe');
    assert.equal((await db.listActivities(otherId)).length, 0);
    assert.equal(await db.getActivity(id, otherId), undefined);
    assert.equal((await db.listGear(otherId)).length, 0);
    // cross-user gear update must be a no-op
    await db.updateActivityGear(id, otherId, null, null);
    assert.equal((await db.getActivity(id, userId))?.shoe_name, 'test shoe');
    // one default per kind
    await db.insertGear(userId, 'shoe', 'second shoe', null);
    await db.setDefaultGear(shoe.id, userId);
    const secondShoe = (await db.listGear(userId)).find((g) => g.name === 'second shoe')!;
    await db.setDefaultGear(secondShoe.id, userId);
    await db.setDefaultGear(watch.id, userId);
    const defaults = (await db.listGear(userId)).filter((g) => g.is_default);
    assert.deepEqual(defaults.map((g) => g.name).sort(), ['second shoe', 'test watch']);
    // cross-user default must be a no-op
    await db.setDefaultGear(secondShoe.id, otherId);
    assert.ok((await db.listGear(userId)).find((g) => g.name === 'second shoe')!.is_default);
    await assert.rejects(
        db.insertActivity(userId, {
            date: '2026-07-13',
            sport: 'curling' as never,
            duration_min: 1,
            distance_km: null,
            notes: null,
            shoe_id: null,
            watch_id: null,
            route: null,
            metrics: null,
            series: null,
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
