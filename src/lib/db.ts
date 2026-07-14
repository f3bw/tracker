import { createClient, type InArgs } from '@libsql/client';

export const SPORTS = ['run', 'walk', 'ride', 'swim', 'strength', 'hiit', 'yoga'] as const;
export type Sport = (typeof SPORTS)[number];

export type Shoe = {
    id: number;
    name: string;
    threshold_km: number | null;
    total_km: number;
};

export type Activity = {
    id: number;
    date: string;
    sport: Sport;
    duration_min: number;
    distance_km: number | null;
    notes: string | null;
    shoe_id: number | null;
    shoe_name?: string | null;
    route: string | null;
};

const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? 'file:data/tracker.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const ready = client.batch(
    [
        `CREATE TABLE IF NOT EXISTS shoes (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            threshold_km REAL
        )`,
        `CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY,
            date TEXT NOT NULL,
            sport TEXT NOT NULL CHECK (sport IN ('run','walk','ride','swim','strength','hiit','yoga')),
            duration_min REAL NOT NULL,
            distance_km REAL,
            notes TEXT,
            shoe_id INTEGER REFERENCES shoes(id) ON DELETE SET NULL,
            route TEXT
        )`,
    ],
    'write',
);

async function run(sql: string, args: InArgs = []) {
    await ready;
    return client.execute({ sql, args });
}

export async function listActivities(): Promise<Activity[]> {
    const r = await run(
        `SELECT a.*, s.name AS shoe_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id
         ORDER BY a.date DESC, a.id DESC`,
    );
    return r.rows as unknown as Activity[];
}

export async function getActivity(id: number): Promise<Activity | undefined> {
    const r = await run(
        `SELECT a.*, s.name AS shoe_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id WHERE a.id = ?`,
        [id],
    );
    return r.rows[0] as unknown as Activity | undefined;
}

export async function insertActivity(a: Omit<Activity, 'id' | 'shoe_name'>): Promise<number> {
    const r = await run(
        `INSERT INTO activities (date, sport, duration_min, distance_km, notes, shoe_id, route)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [a.date, a.sport, a.duration_min, a.distance_km, a.notes, a.shoe_id, a.route],
    );
    return Number(r.lastInsertRowid);
}

export async function deleteActivity(id: number) {
    await run('DELETE FROM activities WHERE id = ?', [id]);
}

export async function listShoes(): Promise<Shoe[]> {
    const r = await run(
        `SELECT s.*, COALESCE(SUM(a.distance_km), 0) AS total_km
         FROM shoes s LEFT JOIN activities a ON a.shoe_id = s.id
         GROUP BY s.id ORDER BY s.name`,
    );
    return r.rows as unknown as Shoe[];
}

export async function insertShoe(name: string, threshold_km: number | null) {
    await run('INSERT INTO shoes (name, threshold_km) VALUES (?, ?)', [name, threshold_km]);
}

export async function deleteShoe(id: number) {
    await run('DELETE FROM shoes WHERE id = ?', [id]);
}

export type SportTotal = { sport: Sport; count: number; km: number; min: number };
export type MonthTotal = { month: string; count: number; km: number; min: number };

export async function sportTotals(): Promise<SportTotal[]> {
    const r = await run(
        `SELECT sport, COUNT(*) AS count, COALESCE(SUM(distance_km), 0) AS km,
                SUM(duration_min) AS min
         FROM activities GROUP BY sport ORDER BY count DESC`,
    );
    return r.rows as unknown as SportTotal[];
}

export async function monthTotals(): Promise<MonthTotal[]> {
    const r = await run(
        `SELECT strftime('%Y-%m', date) AS month, COUNT(*) AS count,
                COALESCE(SUM(distance_km), 0) AS km, SUM(duration_min) AS min
         FROM activities GROUP BY month ORDER BY month DESC`,
    );
    return r.rows as unknown as MonthTotal[];
}
