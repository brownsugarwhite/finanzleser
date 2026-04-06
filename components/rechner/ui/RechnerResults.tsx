import ResultSpacer from "@/components/ui/ResultSpacer";

interface RechnerResultsProps {
  children: React.ReactNode;
}

export default function RechnerResults({ children }: RechnerResultsProps) {
  return (
    <div className="rechner-results">
      <div className="rechner-ergebnis-header">
        <div className="rechner-ergebnis-label">
          <div className="rechner-ergebnis-dot" />
          <span>ERGEBNIS</span>
          <div className="rechner-ergebnis-dot" />
        </div>
        <ResultSpacer />
      </div>
      {children}
    </div>
  );
}
