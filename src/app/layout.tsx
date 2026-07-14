import type { Metadata } from 'next';
import { Header } from '@/components/header/header';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'tracker',
    description: 'personal fitness log',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main>{children}</main>
            </body>
        </html>
    );
}
