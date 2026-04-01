const DOT_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='3'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`;

export default function DotSpacer({ noMargin = false, maxWidth = "860px" }: { noMargin?: boolean; maxWidth?: string }) {
  return (
    <div
      style={{
        maxWidth,
        margin: noMargin ? "0 auto" : "40px auto",
        width: "1000px",
        height: "3px",
        backgroundImage: DOT_SVG,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left center",
        backgroundSize: "9px 3px",
      }}
    />
  );
}
