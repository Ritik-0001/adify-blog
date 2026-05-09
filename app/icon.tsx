import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '108px',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '300px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            lineHeight: 1,
            letterSpacing: '-12px',
            marginTop: '20px',
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size }
  )
}
