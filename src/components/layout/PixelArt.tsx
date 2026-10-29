interface PixelArtProps {
  rows: string[];
  palette: Record<string, string>;
  className?: string;
  gap?: number;
  rounded?: boolean;
}

/**
 * Renders compact pixel-art matrices as bead-like mosaic tiles. All artwork is
 * local, so the marketing pages never depend on remote image hosts.
 */
export const PixelArt = ({
  rows,
  palette,
  className,
  gap = 0,
  rounded = true,
}: PixelArtProps) => {
  const width = rows[0]?.length ?? 0;
  const height = rows.length;

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gap: `${gap}px`,
        aspectRatio: `${width} / ${height}`,
      }}
      aria-hidden="true"
    >
      {rows.flatMap((row, y) =>
        row.split('').map((char, x) => (
          <span
            key={`${x}-${y}`}
            style={{
              background: palette[char] ?? 'transparent',
              borderRadius: rounded ? '22%' : 0,
            }}
          />
        )),
      )}
    </div>
  );
};
