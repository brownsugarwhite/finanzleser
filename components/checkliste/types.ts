export interface ChecklistePunktData {
  nummer: string;
  titel: string;
  beschreibung: string;
}

export interface ChecklisteSektionData {
  titel: string;
  punkte: ChecklistePunktData[];
}

export interface ChecklisteData {
  titel: string;
  sektionen: ChecklisteSektionData[];
}
