import Link from 'next/link';
// ponytail: shares the error page's layout css — split when the two diverge
import styles from '../error/error.module.css';

export function NotFoundPage() {
    return (
        <section className={styles.error} aria-labelledby="not-found-heading">
            <h1 id="not-found-heading" className={styles.heading}>
                page not found
            </h1>
            <p className={styles.hint}>this page doesn&apos;t exist — maybe it was deleted.</p>
            <Link href="/" className={styles.retry}>
                back home
            </Link>
        </section>
    );
}
