import Link from 'next/link';
import { signup } from '@/lib/actions';
import styles from '../login/page.module.css';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
    locked: 'too many attempts — try again in a minute',
    invite: 'wrong invite code',
    taken: 'that username is taken',
    '1': 'username must be 1–30 letters/digits/._-, password at least 8 characters',
};

export default async function Signup({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    return (
        <>
            <h1 className={styles.heading}>sign up</h1>
            <form action={signup} className={styles.form}>
                <label className={styles.field}>
                    invite code
                    <input type="text" name="invite" required autoFocus autoCapitalize="none" />
                </label>
                <label className={styles.field}>
                    username
                    <input type="text" name="username" required autoCapitalize="none" />
                </label>
                <label className={styles.field}>
                    password
                    <input type="password" name="password" required minLength={8} />
                </label>
                {error && <p className={styles.error}>{ERRORS[error] ?? ERRORS['1']}</p>}
                <button type="submit" className={styles.submit}>
                    sign up
                </button>
                <p>
                    <Link href="/login">already have an account? log in</Link>
                </p>
            </form>
        </>
    );
}
