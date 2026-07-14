import FitParser from 'fit-file-parser';
import type { Sport } from './db';

export type Metrics = {
    ascent_m?: number;
    calories?: number;
    avg_hr?: number;
    max_hr?: number;
    avg_cadence?: number;
    avg_temp_c?: number;
    avg_power?: number;
    max_power?: number;
};

export type Series = {
    alt?: number[];
    hr?: number[];
    pace?: number[];
    cad?: number[];
    temp?: number[];
    pw?: number[];
};

export type Lap = {
    min: number;
    km?: number;
    hr?: number;
};

export type ParsedFit = {
    date: string;
    sport: Sport;
    duration_min: number;
    distance_km: number | null;
    route: [number, number][] | null;
    metrics: Metrics | null;
    series: Series | null;
    laps: Lap[] | null;
    fit_b64?: string;
};

// fit-file-parser already converts semicircles to degrees (formatByType, sint32)
function round5(deg: number): number {
    return Math.round(deg * 1e5) / 1e5;
}

export function downsample<T>(points: T[], max = 500): T[] {
    if (points.length <= max) return points;
    const step = points.length / max;
    // ponytail: even-index sampling, good enough for a route silhouette
    return Array.from({ length: max }, (_, i) => points[Math.floor(i * step)]);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ponytail: Garmin reports run/walk cadence per leg — double it so it reads as
// steps/min like every running app; other sports (ride rpm) stay raw
const cadenceFactor = (sport: Sport) => (sport === 'run' || sport === 'walk' ? 2 : 1);

export function extractMetrics(
    session: any,
    records: any[],
    sport: Sport,
): { metrics: Metrics | null; series: Series | null } {
    const metrics: Metrics = {};
    // lengthUnit 'km' converts altitude/ascent too — back to meters
    if (session.total_ascent != null) metrics.ascent_m = Math.round(session.total_ascent * 1000);
    if (session.total_calories != null) metrics.calories = Math.round(session.total_calories);
    if (session.avg_heart_rate != null) metrics.avg_hr = Math.round(session.avg_heart_rate);
    if (session.max_heart_rate != null) metrics.max_hr = Math.round(session.max_heart_rate);
    if (session.avg_cadence != null) {
        metrics.avg_cadence = Math.round(session.avg_cadence * cadenceFactor(sport));
    }
    if (session.avg_temperature != null) metrics.avg_temp_c = Math.round(session.avg_temperature);
    if (session.avg_power != null) metrics.avg_power = Math.round(session.avg_power);
    if (session.max_power != null) metrics.max_power = Math.round(session.max_power);

    const series: Series = {};
    const collect = (pick: (r: any) => number | null | undefined): number[] =>
        downsample(
            records.map(pick).filter((v): v is number => v != null && Number.isFinite(v)),
            200,
        ).map(round1);
    const alt = collect((r) => {
        const a = r.enhanced_altitude ?? r.altitude;
        return a != null ? a * 1000 : null;
    });
    const hr = collect((r) => r.heart_rate);
    const pace = collect((r) => {
        const speed = r.enhanced_speed ?? r.speed; // m/s
        return speed > 0.5 ? 1000 / speed / 60 : null; // min/km, skip standing still
    });
    const cad = collect((r) => (r.cadence != null ? r.cadence * cadenceFactor(sport) : null));
    const temp = collect((r) => r.temperature);
    const pw = collect((r) => r.power);
    if (alt.length > 1) series.alt = alt;
    if (hr.length > 1) series.hr = hr;
    if (pace.length > 1) series.pace = pace;
    if (cad.length > 1) series.cad = cad;
    if (temp.length > 1) series.temp = temp;
    if (pw.length > 1) series.pw = pw;

    return {
        metrics: Object.keys(metrics).length ? metrics : null,
        series: Object.keys(series).length ? series : null,
    };
}

export function extractLaps(laps: any[]): Lap[] | null {
    // one lap = the whole activity, nothing to show
    if (laps.length < 2) return null;
    return laps.slice(0, 100).map((l: any) => {
        const lap: Lap = { min: round1((l.total_timer_time ?? l.total_elapsed_time ?? 0) / 60) };
        if (l.total_distance) lap.km = Math.round(l.total_distance * 100) / 100;
        if (l.avg_heart_rate != null) lap.hr = Math.round(l.avg_heart_rate);
        return lap;
    });
}

const SPORT_MAP: Record<string, Sport> = {
    running: 'run',
    walking: 'walk',
    hiking: 'walk',
    cycling: 'ride',
    swimming: 'swim',
    training: 'strength',
    fitness_equipment: 'strength',
    hiit: 'hiit',
    yoga: 'yoga',
};

export async function parseFit(buffer: Buffer<ArrayBuffer>): Promise<ParsedFit> {
    const data = await new Promise<any>((resolve, reject) => {
        new FitParser({ mode: 'list', lengthUnit: 'km' }).parse(buffer, (err: any, result: any) =>
            err ? reject(new Error(String(err))) : resolve(result),
        );
    });

    const session = data.sessions?.[0] ?? {};
    const start: Date | undefined = session.start_time ?? data.records?.[0]?.timestamp;
    const durationSec: number =
        session.total_timer_time ?? session.total_elapsed_time ?? 0;

    const points: [number, number][] = (data.records ?? [])
        .filter((r: any) => r.position_lat != null && r.position_long != null)
        .map((r: any): [number, number] => [round5(r.position_lat), round5(r.position_long)]);

    const sport = SPORT_MAP[session.sport] ?? 'run';
    return {
        date: (start ?? new Date()).toISOString().slice(0, 10),
        sport,
        duration_min: Math.round(durationSec / 6) / 10,
        distance_km: session.total_distance ? Math.round(session.total_distance * 100) / 100 : null,
        route: points.length ? downsample(points) : null,
        ...extractMetrics(session, data.records ?? [], sport),
        laps: extractLaps(data.laps ?? []),
    };
}
