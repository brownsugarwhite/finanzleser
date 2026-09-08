import WochenbriefForm from "@/components/faden/WochenbriefForm";

/** Leos Wochenbrief am Ende jedes Ratgebers: ein Feld, kein Formular. */
export default function WochenbriefKasten() {
  return (
    <div className="kasten kasten--still" id="wochenbrief">
      <span className="kicker kicker--gruen">Leos Wochenbrief · donnerstags</span>
      <h3>Die Antworten der Woche, donnerstags</h3>
      <p>Was Leser diese Woche gefragt haben, was sich an Werten geändert hat, ein Finanzwort. Ein Feld, kein Formular, jederzeit abbestellbar.</p>
      <WochenbriefForm />
    </div>
  );
}
