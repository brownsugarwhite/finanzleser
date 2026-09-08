# Regeln für Portierungen aus dem Prototyp in den Next.js-Faden

Gilt für jeden Unterauftrag, der Mechaniken aus `docs/prototype/` nach `components/faden/**` bringt.

## Umgebung
- Projekt `/Users/bsw/Projekte/finanzleser`, Branch `feature/faden`, Flag `NEXT_PUBLIC_FADEN=1` ist in `.env.local` gesetzt.
- Dev-Server läuft auf `http://localhost:53270` gegen `cms-dev.finanzleser.de`. Nicht neu starten, keinen zweiten Server, kein `next build` im Projektordner.
- Nie `.env*` lesen oder ausgeben, nichts an Produktion oder am Live-CMS.

## Referenz
- Prototyp-Quellen: `docs/prototype/src/01-css.html` (CSS), `02-body.html`, `03-js-core.html`, `03b-intro.html`, `03c-hero.html`, `04-js-inhalt.html`, `05-js-neu.html`, `05b-js-daten.html`, `06-js-boot.html`. Konzept: `docs/Konzept_Finanzleser_Leo.md`, `docs/Konzept_Technik_Anhang.md`.
- 1:1 portieren: Texte, Maße, Abstände, Timings, Easings, Klassennamen (wo sinnvoll). Die Tokens des Prototyps (`--ink`, `--muted`, `--pink`, `--green`, `--green-ink`, `--tint`, `--rule`, `--rule-strong`, `--serif`, `--sans`, `--tool-*`) gibt es gleichnamig in `app/faden.css` (`.faden-shell`); vorher nachsehen.

## Code
- Next.js 15 App Router, React 19, TypeScript strict. Client-Komponenten beginnen mit `"use client"`.
- Kein Tailwind. CSS in einer **eigenen Datei** `app/<name>.css`, in `app/globals.css` per `@import "./<name>.css";` nach `./statistik.css` eintragen. Selektoren mit `.faden-shell` präfixen (Elemente am `body` mit `body.faden-body`).
- GSAP nur aus `@/lib/gsapConfig`. `prefers-reduced-motion` beachten (`reduzierteBewegung()` in `lib/faden/belohnung.ts`).
- Kontext `useFaden()` (`components/faden/FadenProvider.tsx`): `toast(text)`, `navigieren(href)`, `fragen(text)` (Frage an Leo, Antwort erscheint unten im Faden), `inDenKoffer(titel)`, `koffer`, `belohne(punkte, kastenElement?, { wappen?, text? })` (Konfetti, „+N Punkte“, Puls am Register, Serie zählt mit), `punkte`, `serie`, `wappen`, `level`, `blattOeffnen(key, a?, b?)`.
- Helfer: `lib/faden/belohnung.ts` (`konfetti`, `abzeichen`, `nochmal`, `flugZu`), `lib/faden/optionen.ts` (`getFadenOptionen()` mit Kassensturz, Leo fragt, Wächter, Lebensereignisse, Level; `levelZu()`), `lib/faden/spiele.ts` (`spielAm`, `spielNummer`, `heuteBerlin`), `lib/urls.ts` (URL-Bauer je Typ), `components/faden/KartenKapitel.tsx` (Kapitelrahmen für Nicht-Ratgeber-Seiten), Beispielroute `app/glossar/page.tsx`.
- Keine WP-Abfragen zur Laufzeit außer über gecachte Getter (`lib/wordpress.ts`, `lib/faden/*.ts`). Nie `.catch(() => null)` auf WP-Fetches in gecachten Routen (Fehler müssen werfen).
- Adblocker-neutrale Namen (nie ad, banner, sponsor, promo in Klassen oder IDs). Deutsche UI-Texte, deutsche Namen wie im Bestand.
- Fremde Dateien nur, wenn der Auftrag sie nennt. Tabu ohne Auftrag: `components/faden/FadenProvider.tsx`, `Strom.tsx`, `RandLinks.tsx`, `Kopf.tsx`, `kopf/Register.tsx`, `kopf/Blatt.tsx`, `Eingabe.tsx`, `kette/Aktionen.tsx`, `kette/WerkzeugKarte.tsx`, `app/faden.css`, `app/[kategorie]/**`, `lib/wordpress.ts`, `lib/types.ts`, `next.config.ts`. Neue Dateien sind frei.

## Prüfen
- `npx tsc --noEmit -p .` fehlerfrei; `npx eslint <deine Dateien>` ohne Fehler (Warnungen zu `<img>` sind bekannt).
- Playwright nur aus dem Projektroot, Datei `_<name>.tmp.mjs` (`import { chromium } from "playwright"`, headless), danach löschen. Routen kompilieren beim ersten Aufruf langsam (bis 20 s): `waitUntil: "networkidle"` und 3 s warten. Elemente am Seitenende vor Klicks mit `scrollIntoView({ block: "center" })` holen (die Eingabe unten ist sticky). Konsolenfehler mitschreiben.
- Kein `git add`, kein `git commit`, kein Push.

## Bericht
Am Ende kurz: geänderte/neue Dateien; was 1:1 portiert ist; was bewusst abweicht und warum; Playwright-Ausgabe; offene Punkte; exakte Integrationsstellen (Datei, Zeile, Zeile Code), falls eine Tabu-Datei geändert werden müsste.
