interface RechnerHinweisProps {
  children: React.ReactNode;
}

export default function RechnerHinweis({ children }: RechnerHinweisProps) {
  return <p className="rechner-hinweis">{children}</p>;
}
