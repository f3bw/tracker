import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'tracker',
        short_name: 'tracker',
        description: 'personal fitness log',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
    };
}
