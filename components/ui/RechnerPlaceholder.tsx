export default function RechnerPlaceholder({
  children,
  image,
  alt = "",
}: {
  children?: React.ReactNode;
  seed?: string;
  /** Wenn gesetzt: Illustration (transparentes PNG) statt grauem Platzhalter. */
  image?: string;
  alt?: string;
}) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      flex: 1,
      // Grauer Platzhalter nur noch als Fallback, wenn kein Bild übergeben wird.
      background: image ? undefined : 'var(--color-placeholder-bg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    }}>
      {image && (
        <img
          src={image}
          alt={alt}
          aria-hidden={alt === '' ? true : undefined}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
    </div>
  );
}
