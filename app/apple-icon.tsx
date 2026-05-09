import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f97316',
          borderRadius: '38px',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '108px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            lineHeight: 1,
            letterSpacing: '-4px',
            marginTop: '8px',
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size }
  )
}
