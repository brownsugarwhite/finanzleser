export default function ResultSpacer() {
  return (
    <div className="result-spacer">
      <div className="result-spacer-lines">
        <div className="result-spacer-line-thick" />
        <div className="result-spacer-line-thin" />
      </div>
      <img src="/icons/arrow down_double.svg" alt="" className="result-spacer-icon" />
      <div className="result-spacer-lines">
        <div className="result-spacer-line-thick" />
        <div className="result-spacer-line-thin" />
      </div>
    </div>
  );
}
