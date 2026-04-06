export default function ResultSpacer() {
  return (
    <div className="result-spacer">
      <svg viewBox="0 0 2000 20" fill="none" className="result-spacer-icon" preserveAspectRatio="xMidYMid meet">
        <path
          d="M2000.5 1H1018L1000.5 18.5L983 1H0"
          stroke="var(--color-text-primary, #334A27)"
          strokeWidth="1"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
