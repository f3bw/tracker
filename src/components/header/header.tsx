import Link from 'next/link';
import { cookies } from 'next/headers';
import { logout } from '@/lib/actions';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import styles from './header.module.css';

export async function Header() {
    const cookie = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
    const loggedIn = (await verifySession(cookie)) !== null;
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.title}>
                tracker
            </Link>
            {loggedIn && (
                <nav className={styles.nav}>
                    <Link href="/activities/new">log</Link>
                    <Link href="/upload">upload</Link>
                    <Link href="/shoes">shoes</Link>
                    <Link href="/stats">stats</Link>
                    <form action={logout}>
                        <button type="submit" className={styles.logout}>
                            log out
                        </button>
                    </form>
                </nav>
            )}
        </header>
    );
}
