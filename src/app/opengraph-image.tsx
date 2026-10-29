import { ImageResponse } from 'next/og';

export const alt = 'beadai — turn any photo or idea into a fuse bead pattern';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Rendered on request instead of at build time: satori is memory hungry and
 * pushing it through static generation exhausts the build worker.
 */
export const dynamic = 'force-dynamic';

const BEADS = [
  ['#FF6B6B', '#FFB84C', '#3BC9DB', '#7C5CFF', '#FF6B6B', '#FFB84C'],
  ['#FFB84C', '#7C5CFF', '#FF6B6B', '#3BC9DB', '#FFB84C', '#7C5CFF'],
  ['#3BC9DB', '#FF6B6B', '#FFB84C', '#FF6B6B', '#7C5CFF', '#3BC9DB'],
  ['#7C5CFF', '#3BC9DB', '#7C5CFF', '#FFB84C', '#3BC9DB', '#FF6B6B'],
  ['#FF6B6B', '#FFB84C', '#3BC9DB', '#7C5CFF', '#FF6B6B', '#FFB84C'],
  ['#FFB84C', '#7C5CFF', '#FF6B6B', '#3BC9DB', '#FFB84C', '#7C5CFF'],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FFFDF7',
          padding: '72px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '740px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#7C5CFF',
                marginRight: '20px',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: '44px',
                fontWeight: 700,
                color: '#2B2A29',
                letterSpacing: '-0.02em',
              }}
            >
              beadai
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: '44px',
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.12,
              color: '#2B2A29',
              letterSpacing: '-0.03em',
            }}
          >
            Turn any photo into a fuse bead pattern
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: '28px',
              fontSize: '32px',
              color: '#6B6660',
              lineHeight: 1.35,
            }}
          >
            Perler &amp; Artkal colour matching, exact bead counts and printable charts.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '26px',
            borderRadius: '32px',
            background: '#F6F1E7',
            border: '1px solid rgba(43,42,41,0.06)',
          }}
        >
          {BEADS.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: 'flex' }}>
              {row.map((color, columnIndex) => (
                <div
                  key={columnIndex}
                  style={{
                    display: 'flex',
                    width: '62px',
                    height: '62px',
                    margin: '5px',
                    borderRadius: '999px',
                    background: color,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
