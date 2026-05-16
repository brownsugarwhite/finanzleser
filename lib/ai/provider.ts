import { google } from "@ai-sdk/google";

/**
 * Single point of truth für das Chat-Modell.
 *
 * Beim späteren Swap auf das Kunden-eigene KI-Tool wird ausschließlich diese
 * Datei angepasst (z. B. durch einen `fetch()`-Forward an den Kunden-Endpoint
 * via custom LanguageModel). Frontend (`useChat`) und Route-Handler bleiben
 * unverändert.
 */
export function getChatModel() {
  return google("gemini-2.5-flash");
}
