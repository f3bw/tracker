import assert from 'node:assert';
import { test } from 'node:test';
import os from 'node:os';
import path from 'node:path';

process.env.TURSO_DATABASE_URL = `file:${path.join(os.tmpdir(), `tracker-test-${process.pid}.db`)}`;

// ~1.11 km due north along a meridian, 10 minutes, climbing 10 m
const APPLE_STYLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Apple Health Export">
 <trk><name>Route 2026-07-14 7:30am</name><trkseg>
  <trkpt lat="52.00000" lon="4.30000"><ele>2.1</ele><time>2026-07-14T05:30:00Z</time></trkpt>
  <trkpt lat="52.00500" lon="4.30000"><ele>7.4</ele><time>2026-07-14T05:35:00Z</time></trkpt>
  <trkpt lat="52.01000" lon="4.30000"><ele>12.2</ele><time>2026-07-14T05:40:00Z</time></trkpt>
 </trkseg></trk>
</gpx>`;

test('parseGpx: route, distance, duration, altitude from apple-style gpx', async () => {
    const { parseGpx } = await import('../src/lib/gpx.ts');
    const p = parseGpx(APPLE_STYLE_GPX);
    assert.equal(p.date, '2026-07-14');
    assert.equal(p.duration_min, 10);
    assert.equal(p.distance_km, 1.11);
    assert.deepEqual(p.route, [
        [52, 4.3],
        [52.005, 4.3],
        [52.01, 4.3],
    ]);
    assert.deepEqual(p.series, { alt: [2.1, 7.4, 12.2] });
    assert.equal(p.metrics, null);
    assert.equal(p.laps, null);
});

test('parseGpx: lon-before-lat attribute order and missing ele/time', async () => {
    const { parseGpx } = await import('../src/lib/gpx.ts');
    const p = parseGpx(
        '<gpx><trk><trkseg><trkpt lon="4.3" lat="52.0"></trkpt><trkpt lon="4.31" lat="52.0"></trkpt></trkseg></trk></gpx>',
    );
    assert.deepEqual(p.route, [
        [52, 4.3],
        [52, 4.31],
    ]);
    assert.equal(p.duration_min, 0);
    assert.equal(p.series, null);
});

test('parseGpx: no track points throws', async () => {
    const { parseGpx } = await import('../src/lib/gpx.ts');
    assert.throws(() => parseGpx('<gpx></gpx>'), /no track points/);
});
