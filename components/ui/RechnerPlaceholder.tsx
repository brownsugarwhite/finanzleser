export default function RechnerPlaceholder({ children }: { children?: React.ReactNode; seed?: string }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      flex: 1,
      background: 'var(--color-placeholder-bg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}
