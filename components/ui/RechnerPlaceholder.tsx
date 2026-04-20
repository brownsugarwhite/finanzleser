import VisualLottie from "./VisualLottie";

export default function RechnerPlaceholder({ children, seed }: { children?: React.ReactNode; seed?: string }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      flex: 1,
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    }}>
      <VisualLottie seed={seed} />
      {children}
    </div>
  );
}
