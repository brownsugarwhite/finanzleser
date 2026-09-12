/**
 * Das eine ISR-Intervall (Regel 11 in CLAUDE.md).
 *
 * 🚨 Eigene Datei, obwohl es nur eine Zahl ist. Vorher stand sie in lib/wordpress.ts —
 * und lib/faden/optionen.ts holte sie von dort. Neun Faden-Client-Komponenten importieren
 * aus optionen.ts (levelZu, LEVEL_STANDARD, Typen), also zog diese eine Zahl den ganzen
 * Modulbaum von lib/wordpress in das Browser-Bundle: graphql-request samt
 * GraphQL-Parser und Lexer. Der Bundle-Analyzer hat es sichtbar gemacht.
 */
export const CONTENT_REVALIDATE = 86400;
