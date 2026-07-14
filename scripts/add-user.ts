// usage: pnpm add-user <username> <password>
// targets the db from TURSO_DATABASE_URL (loaded from .env.local via --env-file)
import { getUserByUsername, insertUser } from '../src/lib/db.ts';
import { hashPassword } from '../src/lib/password.ts';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
    console.error('usage: pnpm add-user <username> <password>');
    process.exit(1);
}
if (await getUserByUsername(username)) {
    console.error(`user "${username}" already exists`);
    process.exit(1);
}
const id = await insertUser(username, hashPassword(password));
console.log(`created user "${username}" (id ${id})`);
