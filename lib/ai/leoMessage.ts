import type { UIMessage } from "ai";

/**
 * Eine Quelle, die das LEO-Backend (Kunden-RAG-Service) pro Antwort liefert.
 * Kommt im `meta`-SSE-Event als `sources: [...]`.
 */
export interface LeoSource {
  title: string;
  pages: string;
}

/**
 * LEO-spezifische UIMessage: Standard-Text-Parts plus ein Data-Part `data-sources`,
 * über das die Quellen-Liste an die Chat-UI gestreamt wird.
 *
 * Genutzt von der Proxy-Route (`app/api/chat/route.ts`) beim Schreiben des Streams
 * und vom Frontend (`useChat<LeoUIMessage>`, `LeoChatMessages`) beim Rendern.
 */
export type LeoUIMessage = UIMessage<unknown, { sources: LeoSource[] }>;
