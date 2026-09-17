import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      // NEXT_DIST_DIR baut in ein eigenes Verzeichnis (next.config.ts). Ohne diese Zeile
      // liest eslint den erzeugten Code mit: aus 44 Fehlern wurden 1394.
      ".next-*/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // WordPress-Plugin-Code, kein Next.js: blocks.js nutzt die Gutenberg-API, in der
      // `edit`-Funktionen regulaer Hooks aufrufen. Die Regel react-hooks/rules-of-hooks
      // erwartet dort Grossschreibung und meldet sonst 47 Fehler, die keine sind.
      // Geprueft wird diese Datei stattdessen mit `node --check` (siehe wordpress/README.md).
      "wordpress/**",
      // Fremdcode, minifiziert ausgeliefert (html2canvas für den PDF-Export der
      // Checklisten). Er wird nicht von uns gepflegt, und `no-this-alias` auf einer
      // Minifikat-Zeile ist keine Aussage über unseren Code.
      "public/scripts/**",
    ],
  },
];

export default eslintConfig;
