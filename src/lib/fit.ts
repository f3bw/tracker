import FitParser from 'fit-file-parser';
import type { Sport } from './db';

export type ParsedFit = {
    date: string;
    sport: Sport;
    duration_min: number;
    distance_km: number | null;
    route: [number, number][] | null;
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

    return {
        date: (start ?? new Date()).toISOString().slice(0, 10),
        sport: SPORT_MAP[session.sport] ?? 'run',
        duration_min: Math.round(durationSec / 6) / 10,
        distance_km: session.total_distance ? Math.round(session.total_distance * 100) / 100 : null,
        route: points.length ? downsample(points) : null,
    };
}
