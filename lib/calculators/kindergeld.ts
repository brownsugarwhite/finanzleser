import { RATES } from "./rates";
import { rund } from "./utils";

export interface KindergeldParams {
  kinder: number;
}

export interface KindergeldResult {
  kindergeldProKind: number;
  kinder: number;
  gesamtKindergeld: number;
  jaehrlich: number;
}

export function berechne({ kinder }: KindergeldParams): KindergeldResult {
  const kindergeldProKind = RATES.unterhalt.kindergeld_pro_kind;
  const gesamtKindergeld = rund(kindergeldProKind * kinder);
  const jaehrlich = rund(gesamtKindergeld * 12);

  return {
    kindergeldProKind,
    kinder,
    gesamtKindergeld,
    jaehrlich,
  };
}
