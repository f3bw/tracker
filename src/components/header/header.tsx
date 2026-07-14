import Link from 'next/link';
import styles from './header.module.css';

export function Header() {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.title}>
                tracker
            </Link>
            <nav className={styles.nav}>
                <Link href="/activities/new">log</Link>
                <Link href="/upload">upload</Link>
                <Link href="/shoes">shoes</Link>
                <Link href="/stats">stats</Link>
            </nav>
        </header>
    );
}
