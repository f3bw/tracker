import Link from 'next/link';
import styles from './landing.module.css';

export function Landing() {
    return (
        <>
            <p className={styles.landing}>
                A privacy-first health &amp; activity tracker — a personal Strava replacement.
                Upload .fit files from your watch or log activities by hand, track your shoes and
                watches, and see your stats. Your workouts live in your own database — no ads, no
                tracking, no data shared with anyone. Self-hosted and open by design.
            </p>
            <Link href="/login" className={styles['login-link']}>
                log in
            </Link>
        </>
    );
}
