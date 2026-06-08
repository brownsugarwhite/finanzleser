import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import type { LeoSource, LeoUIMessage } from "@/lib/ai/leoMessage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// LEO-Backend des Kunden (Heroku). Default fest verdrahtet, weil die URL kein
// Secret ist und netlify.toml-Env nicht zuverlässig in die Function-Laufzeit
// gelangt. Per ENV überschreibbar (z. B. spätere separate Prod-URL).
const LEO_BACKEND_URL =
  process.env.LEO_BACKEND_URL ?? "https://leo-finanzleser-ea7e1549925c.herokuapp.com";

/** Reiner Text einer UIMessage (Text-Parts zusammenfügen). */
function messageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

/**
 * Proxy auf das LEO-Backend des Kunden (Python/FastAPI-RAG-Service auf Heroku).
 *
 * Übersetzt zwischen zwei Streaming-Protokollen:
 *  - eingehend: AI-SDK-UIMessages vom Frontend (`useChat`)
 *  - Backend:   `POST /chat/stream` mit `{ message, history, slug, category }`,
 *               Antwort als SSE (`event: meta|token|done|error`)
 *  - ausgehend: AI-SDK-UIMessage-Stream, damit `useChat` unverändert weiterläuft.
 *
 * Das Backend besitzt Modell (Claude Haiku 4.5) und System-Prompt selbst — hier
 * wird nur weitergereicht und das SSE-Format konvertiert.
 */
export async function POST(req: Request) {
  try {
    const {
      messages,
      slug,
      category,
      versicherer,
    }: { messages: UIMessage[]; slug?: string; category?: string; versicherer?: string } =
      await req.json();

    // Letzte User-Nachricht = aktuelle Frage; alles davor = history.
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    let message = lastUserIdx >= 0 ? messageText(messages[lastUserIdx]) : "";

    // Bei gewähltem Anbieter: strikte, stille Anweisung anhängen (steuert Claude
    // UND die RAG-Suche, da der Anbietername Teil der Frage wird).
    if (versicherer?.trim()) {
      message +=
        `\n\n(Anweisung: Beziehe deine Antwort strikt auf den Anbieter „${versicherer}". ` +
        `Stelle Angebot, Konditionen und Besonderheiten dieses Anbieters in den Mittelpunkt. ` +
        `Wenn die Dokumente nichts Anbieterspezifisches hergeben, nutze die Live-Web-Suche.)`;
    }
    const history = messages
      .slice(0, lastUserIdx < 0 ? messages.length : lastUserIdx)
      .map((m) => ({ role: m.role, content: messageText(m) }))
      .filter((m) => m.content.trim().length > 0);

    const upstream = await fetch(`${LEO_BACKEND_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, slug, category }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      throw new Error(`Backend ${upstream.status}: ${detail.slice(0, 200)}`);
    }

    const stream = createUIMessageStream<LeoUIMessage>({
      async execute({ writer }) {
        const textId = "leo-answer";
        writer.write({ type: "text-start", id: textId });

        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Ein SSE-Block (durch \n\n getrennt) → AI-SDK-Chunk.
        const handleBlock = (block: string) => {
          let event = "message";
          let data = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          const payload = data ? JSON.parse(data) : {};
          if (event === "token") {
            if (payload.text) writer.write({ type: "text-delta", id: textId, delta: payload.text });
          } else if (event === "meta") {
            const sources = (payload.sources ?? []) as LeoSource[];
            if (sources.length) writer.write({ type: "data-sources", data: sources });
          } else if (event === "error") {
            throw new Error(payload.detail || "Backend-Fehler");
          }
          // "done" → Schleife endet ohnehin mit dem Stream-Ende.
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";
          for (const block of blocks) if (block.trim()) handleBlock(block);
        }
        if (buffer.trim()) handleBlock(buffer);

        writer.write({ type: "text-end", id: textId });
      },
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /rate.?limit|429|quota/i.test(message) ? 429 : 500;
    const userMessage = status === 429
      ? "Leo macht gerade eine kurze Pause. Bitte versuchen Sie es in einer Minute erneut."
      : "Leo ist gerade nicht erreichbar. Bitte versuchen Sie es später noch einmal.";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: userMessage }, { status });
  }
}
