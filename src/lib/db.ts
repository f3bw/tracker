import { createClient, type InArgs } from '@libsql/client';

export const SPORTS = ['run', 'walk', 'ride', 'swim', 'strength', 'hiit', 'yoga'] as const;
export type Sport = (typeof SPORTS)[number];

export type User = {
    id: number;
    username: string;
    password_hash: string;
};

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
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS shoes (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name TEXT NOT NULL,
            threshold_km REAL
        )`,
        `CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
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

export async function getUserByUsername(username: string): Promise<User | undefined> {
    const r = await run('SELECT * FROM users WHERE username = ?', [username]);
    return r.rows[0] as unknown as User | undefined;
}

export async function insertUser(username: string, password_hash: string): Promise<number> {
    const r = await run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [
        username,
        password_hash,
    ]);
    return Number(r.lastInsertRowid);
}

export async function listActivities(userId: number): Promise<Activity[]> {
    const r = await run(
        `SELECT a.*, s.name AS shoe_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id
         WHERE a.user_id = ?
         ORDER BY a.date DESC, a.id DESC`,
        [userId],
    );
    return r.rows as unknown as Activity[];
}

export async function getActivity(id: number, userId: number): Promise<Activity | undefined> {
    const r = await run(
        `SELECT a.*, s.name AS shoe_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id
         WHERE a.id = ? AND a.user_id = ?`,
        [id, userId],
    );
    return r.rows[0] as unknown as Activity | undefined;
}

export async function insertActivity(
    userId: number,
    a: Omit<Activity, 'id' | 'shoe_name'>,
): Promise<number> {
    const r = await run(
        `INSERT INTO activities (user_id, date, sport, duration_min, distance_km, notes, shoe_id, route)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, a.date, a.sport, a.duration_min, a.distance_km, a.notes, a.shoe_id, a.route],
    );
    return Number(r.lastInsertRowid);
}

export async function deleteActivity(id: number, userId: number) {
    await run('DELETE FROM activities WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function listShoes(userId: number): Promise<Shoe[]> {
    const r = await run(
        `SELECT s.*, COALESCE(SUM(a.distance_km), 0) AS total_km
         FROM shoes s LEFT JOIN activities a ON a.shoe_id = s.id
         WHERE s.user_id = ?
         GROUP BY s.id ORDER BY s.name`,
        [userId],
    );
    return r.rows as unknown as Shoe[];
}

export async function insertShoe(userId: number, name: string, threshold_km: number | null) {
    await run('INSERT INTO shoes (user_id, name, threshold_km) VALUES (?, ?, ?)', [
        userId,
        name,
        threshold_km,
    ]);
}

export async function deleteShoe(id: number, userId: number) {
    await run('DELETE FROM shoes WHERE id = ? AND user_id = ?', [id, userId]);
}

export type SportTotal = { sport: Sport; count: number; km: number; min: number };
export type MonthTotal = { month: string; count: number; km: number; min: number };

export async function sportTotals(userId: number): Promise<SportTotal[]> {
    const r = await run(
        `SELECT sport, COUNT(*) AS count, COALESCE(SUM(distance_km), 0) AS km,
                SUM(duration_min) AS min
         FROM activities WHERE user_id = ? GROUP BY sport ORDER BY count DESC`,
        [userId],
    );
    return r.rows as unknown as SportTotal[];
}

export async function monthTotals(userId: number): Promise<MonthTotal[]> {
    const r = await run(
        `SELECT strftime('%Y-%m', date) AS month, COUNT(*) AS count,
                COALESCE(SUM(distance_km), 0) AS km, SUM(duration_min) AS min
         FROM activities WHERE user_id = ? GROUP BY month ORDER BY month DESC`,
        [userId],
    );
    return r.rows as unknown as MonthTotal[];
}
