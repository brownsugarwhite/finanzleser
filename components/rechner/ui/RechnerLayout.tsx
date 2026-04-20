"use client";

import RechnerPlaceholder from "@/components/ui/RechnerPlaceholder";

interface RechnerLayoutProps {
  title: string;
  children: React.ReactNode;
  results?: React.ReactNode;
}

export default function RechnerLayout({ title, children, results }: RechnerLayoutProps) {
  return (
    <div className="rechner-container">
      <h3 className="rechner-title">{title}</h3>

      <div className="rechner-main">
        {/* Left: Visual */}
        <div className="rechner-visual">
          <RechnerPlaceholder seed={title} />
        </div>

        {/* Right: Inputs + Button */}
        <div className="rechner-form">
          {children}
        </div>
      </div>

      {/* Results centered below */}
      {results && (
        <div className="rechner-results-wrapper">
          {results}
        </div>
      )}
    </div>
  );
}
