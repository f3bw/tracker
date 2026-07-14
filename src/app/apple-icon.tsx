import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// no border radius: iOS applies its own mask to touch icons
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    alignItems: 'center',
                    background: 'hsl(0, 0%, 4%)',
                    color: 'hsl(0, 0%, 100%)',
                    display: 'flex',
                    fontSize: 128,
                    height: '100%',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                t
            </div>
        ),
        size
    );
}
