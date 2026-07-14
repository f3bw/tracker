import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '8mb', // fit file rides the confirm form as base64
        },
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                ],
            },
        ];
    },
};

export default nextConfig;
