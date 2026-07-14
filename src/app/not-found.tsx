import Link from 'next/link';

export default function NotFound() {
    return (
        <main>
            <h1>404</h1>
            <p>Page not found. <Link href="/">Back home</Link></p>
        </main>
    );
}
