export default function RechnerPlaceholder({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      flex: 1,
      background: 'rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>
      {children}
    </div>
  );
}
