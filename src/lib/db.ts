import { createClient, type InArgs } from '@libsql/client';

export const SPORTS = ['run', 'walk', 'ride', 'swim', 'strength', 'hiit', 'yoga'] as const;
export type Sport = (typeof SPORTS)[number];

export type User = {
    id: number;
    username: string;
    password_hash: string;
};

export type Gear = {
    id: number;
    kind: 'shoe' | 'watch';
    name: string;
    threshold_km: number | null;
    is_default: number;
    total_km: number;
    total_min: number;
    activity_count: number;
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
    watch_id: number | null;
    watch_name?: string | null;
    route: string | null;
    metrics: string | null;
    series: string | null;
    laps: string | null;
};

const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? 'file:data/tracker.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// ponytail: the gear table keeps its historical "shoes" name — a rename isn't
// worth a manual migration on the live db; `kind` distinguishes shoes/watches
const ready = (async () => {
    await client.batch(
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
                threshold_km REAL,
                kind TEXT NOT NULL DEFAULT 'shoe' CHECK (kind IN ('shoe','watch')),
                is_default INTEGER NOT NULL DEFAULT 0
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
                watch_id INTEGER REFERENCES shoes(id) ON DELETE SET NULL,
                route TEXT,
                metrics TEXT,
                series TEXT,
                laps TEXT
            )`,
        ],
        'write',
    );
    // additive migrations for dbs created before these columns existed
    for (const sql of [
        `ALTER TABLE shoes ADD COLUMN kind TEXT NOT NULL DEFAULT 'shoe'`,
        `ALTER TABLE activities ADD COLUMN watch_id INTEGER REFERENCES shoes(id)`,
        `ALTER TABLE shoes ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE activities ADD COLUMN metrics TEXT`,
        `ALTER TABLE activities ADD COLUMN series TEXT`,
        `ALTER TABLE activities ADD COLUMN laps TEXT`,
    ]) {
        await client.execute(sql).catch(() => {}); // duplicate column = already migrated
    }
})();

async function run(sql: string, args: InArgs = []) {
    await ready;
    return client.execute({ sql, args });
}

// libsql Row objects aren't plain — React can't pass them to client components
async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
    const r = await run(sql, args);
    return r.rows.map(
        (row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])) as T,
    );
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
    return (await all<User>('SELECT * FROM users WHERE username = ?', [username]))[0];
}

export async function insertUser(username: string, password_hash: string): Promise<number> {
    const r = await run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [
        username,
        password_hash,
    ]);
    return Number(r.lastInsertRowid);
}

export async function listActivities(userId: number): Promise<Activity[]> {
    return all<Activity>(
        `SELECT a.*, s.name AS shoe_name, w.name AS watch_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id
         LEFT JOIN shoes w ON w.id = a.watch_id
         WHERE a.user_id = ?
         ORDER BY a.date DESC, a.id DESC`,
        [userId],
    );
}

export async function getActivity(id: number, userId: number): Promise<Activity | undefined> {
    const rows = await all<Activity>(
        `SELECT a.*, s.name AS shoe_name, w.name AS watch_name FROM activities a
         LEFT JOIN shoes s ON s.id = a.shoe_id
         LEFT JOIN shoes w ON w.id = a.watch_id
         WHERE a.id = ? AND a.user_id = ?`,
        [id, userId],
    );
    return rows[0];
}

export async function insertActivity(
    userId: number,
    a: Omit<Activity, 'id' | 'shoe_name' | 'watch_name'>,
): Promise<number> {
    const r = await run(
        `INSERT INTO activities (user_id, date, sport, duration_min, distance_km, notes, shoe_id, watch_id, route, metrics, series, laps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            a.date,
            a.sport,
            a.duration_min,
            a.distance_km,
            a.notes,
            a.shoe_id,
            a.watch_id,
            a.route,
            a.metrics,
            a.series,
            a.laps,
        ],
    );
    return Number(r.lastInsertRowid);
}

export async function updateActivityGear(
    id: number,
    userId: number,
    shoeId: number | null,
    watchId: number | null,
) {
    await run('UPDATE activities SET shoe_id = ?, watch_id = ? WHERE id = ? AND user_id = ?', [
        shoeId,
        watchId,
        id,
        userId,
    ]);
}

export async function deleteActivity(id: number, userId: number) {
    await run('DELETE FROM activities WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function listGear(userId: number): Promise<Gear[]> {
    return all<Gear>(
        `SELECT g.*, COALESCE(SUM(a.distance_km), 0) AS total_km,
                COALESCE(SUM(a.duration_min), 0) AS total_min,
                COUNT(a.id) AS activity_count
         FROM shoes g LEFT JOIN activities a
             ON (g.kind = 'shoe' AND a.shoe_id = g.id) OR (g.kind = 'watch' AND a.watch_id = g.id)
         WHERE g.user_id = ?
         GROUP BY g.id ORDER BY g.kind, g.name`,
        [userId],
    );
}

export async function insertGear(
    userId: number,
    kind: Gear['kind'],
    name: string,
    threshold_km: number | null,
) {
    await run('INSERT INTO shoes (user_id, kind, name, threshold_km) VALUES (?, ?, ?, ?)', [
        userId,
        kind,
        name,
        threshold_km,
    ]);
}

export async function deleteGear(id: number, userId: number) {
    await run('DELETE FROM shoes WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function setDefaultGear(id: number, userId: number) {
    // one default per kind: clear siblings of the same kind, then set
    await run(
        `UPDATE shoes SET is_default = 0
         WHERE user_id = ? AND kind = (SELECT kind FROM shoes WHERE id = ? AND user_id = ?)`,
        [userId, id, userId],
    );
    await run('UPDATE shoes SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);
}

export type SportTotal = { sport: Sport; count: number; km: number; min: number };
export type MonthTotal = { month: string; count: number; km: number; min: number };

export async function sportTotals(userId: number): Promise<SportTotal[]> {
    return all<SportTotal>(
        `SELECT sport, COUNT(*) AS count, COALESCE(SUM(distance_km), 0) AS km,
                SUM(duration_min) AS min
         FROM activities WHERE user_id = ? GROUP BY sport ORDER BY count DESC`,
        [userId],
    );
}

export async function monthTotals(userId: number): Promise<MonthTotal[]> {
    return all<MonthTotal>(
        `SELECT strftime('%Y-%m', date) AS month, COUNT(*) AS count,
                COALESCE(SUM(distance_km), 0) AS km, SUM(duration_min) AS min
         FROM activities WHERE user_id = ? GROUP BY month ORDER BY month DESC`,
        [userId],
    );
}
