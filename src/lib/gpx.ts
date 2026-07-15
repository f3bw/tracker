import { downsample, type ParsedFit } from './fit.ts';

// ponytail: regex parse, not an XML parser — GPX from Apple Health / most watches
// is machine-generated with one <trkpt> shape; swap in a real parser if a file
// ever shows up that this chokes on
const TRKPT =
    /<trkpt\s+(?:lat="([-\d.]+)"\s+lon="([-\d.]+)"|lon="([-\d.]+)"\s+lat="([-\d.]+)")[^>]*>([\s\S]*?)<\/trkpt>/g;

function haversineKm(a: [number, number], b: [number, number]): number {
    const rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad;
    const dLon = (b[1] - a[1]) * rad;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function parseGpx(xml: string): ParsedFit {
    const pts: { lat: number; lon: number; ele?: number; t?: number }[] = [];
    for (const m of xml.matchAll(TRKPT)) {
        const lat = Number(m[1] ?? m[4]);
        const lon = Number(m[2] ?? m[3]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const body = m[5];
        const ele = body.match(/<ele>([-\d.]+)<\/ele>/);
        const time = body.match(/<time>([^<]+)<\/time>/);
        pts.push({
            lat,
            lon,
            ele: ele ? Number(ele[1]) : undefined,
            t: time ? Date.parse(time[1]) : undefined,
        });
    }
    if (!pts.length) throw new Error('no track points found');

    let distKm = 0;
    for (let i = 1; i < pts.length; i++) {
        distKm += haversineKm([pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon]);
    }

    const times = pts.map((p) => p.t).filter((t): t is number => t != null && !Number.isNaN(t));
    const durationMin = times.length >= 2 ? (times[times.length - 1] - times[0]) / 60_000 : 0;

    const alt = downsample(
        pts.map((p) => p.ele).filter((e): e is number => e != null),
        200,
    ).map(round1);

    return {
        date: (times.length ? new Date(times[0]) : new Date()).toISOString().slice(0, 10),
        // GPX carries no sport — user corrects it on the confirm form
        sport: 'run',
        duration_min: Math.round(durationMin * 10) / 10,
        distance_km: distKm ? Math.round(distKm * 100) / 100 : null,
        route: downsample(
            pts.map((p): [number, number] => [
                Math.round(p.lat * 1e5) / 1e5,
                Math.round(p.lon * 1e5) / 1e5,
            ]),
        ),
        metrics: null, // GPX route files carry no HR/calories/cadence
        series: alt.length > 1 ? { alt } : null,
        laps: null,
    };
}
