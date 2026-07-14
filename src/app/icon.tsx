import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    alignItems: 'center',
                    background: 'hsl(0, 0%, 4%)',
                    borderRadius: 96,
                    color: 'hsl(0, 0%, 100%)',
                    display: 'flex',
                    fontSize: 360,
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
