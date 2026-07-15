import Link from 'next/link';
import { login } from '@/lib/actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function Login({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <>
            <h1 className={styles.heading}>log in</h1>
            <form action={login} className={styles.form}>
                <label className={styles.field}>
                    username
                    <input type="text" name="username" required autoFocus autoCapitalize="none" />
                </label>
                <label className={styles.field}>
                    password
                    <input type="password" name="password" required />
                </label>
                {error && (
                    <p className={styles.error}>
                        {error === 'locked'
                            ? 'too many attempts — try again in a minute'
                            : 'wrong username or password'}
                    </p>
                )}
                <button type="submit" className={styles.submit}>
                    log in
                </button>
                <p>
                    <Link href="/signup">have an invite code? sign up</Link>
                </p>
            </form>
        </>
    );
}
