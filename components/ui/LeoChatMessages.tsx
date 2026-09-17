"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import gsap from "@/lib/gsapConfig";
import { cn } from "@/lib/cn";
import BubbleSpike from "@/components/ui/BubbleSpike";
import type { LeoSource, LeoUIMessage } from "@/lib/ai/leoMessage";

interface LeoChatMessagesProps {
  messages: LeoUIMessage[];
  /** AI-SDK Chat-Status: 'submitted' (wartet auf erste Bytes), 'streaming' (Tokens kommen), 'ready', 'error'. */
  status: "submitted" | "streaming" | "ready" | "error";
  /** Fehler vom useChat-Hook — wird als rote Fehler-Bubble unter den Messages gerendert. */
  error?: Error;
  /** Layout-Mode für CSS-Selektoren (Padding-Left für Assistant-Bubble in conversation). */
  mode: "welcome" | "conversation";
}

function getMessageText(message: LeoUIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

/** Quellen aus dem `data-sources`-Part (vom LEO-Backend via meta-Event). */
function getSources(message: LeoUIMessage): LeoSource[] {
  const part = message.parts.find((p) => p.type === "data-sources");
  return (part as { type: "data-sources"; data: LeoSource[] } | undefined)?.data ?? [];
}

/** Trennt einen angehängten "Anbieter: …"-Hinweis vom eigentlichen Fragetext ab,
 *  damit er separat (kursiv/heller) gerendert werden kann. */
const ANBIETER_MARKER = "\n\nAnbieter: ";
function splitAnbieter(text: string): { main: string; anbieter: string | null } {
  const idx = text.lastIndexOf(ANBIETER_MARKER);
  if (idx === -1) return { main: text, anbieter: null };
  return { main: text.slice(0, idx), anbieter: text.slice(idx + ANBIETER_MARKER.length) };
}

export default function LeoChatMessages({ messages, status, error, mode }: LeoChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial Fade-In wenn Component zum ersten Mal Content hat (deps auf
  // hasContent damit useEffect feuert nachdem DOM gerendert ist).
  const hasContent = messages.length > 0 || !!error;
  useEffect(() => {
    if (!hasContent) return;
    const messagesEl = containerRef.current;
    if (messagesEl) gsap.fromTo(messagesEl, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.25 });
  }, [hasContent]);

  // Auto-Scroll während Streaming: Trigger ist messages.length + Länge des letzten
  // Assistant-Texts, damit auch während des Streams nach unten gescrollt wird.
  const lastLength = messages.length > 0 ? getMessageText(messages[messages.length - 1]).length : 0;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, lastLength]);


  if (messages.length === 0 && !error) return null;

  return (
    <div id="leo-chat-messages" ref={containerRef} data-mode={mode}>
      {messages.map((message, idx) => {
        const isUser = message.role === "user";
        const isLast = idx === messages.length - 1;
        const showCursor = !isUser && isLast && (status === "streaming" || status === "submitted");
        const text = getMessageText(message);
        const sources = isUser ? [] : getSources(message);
        return (
          <div
            key={message.id}
            className={cn("chat-row", isUser ? "chat-row--user" : "chat-row--assistant")}
          >
            <div className="chat-bubble-wrap">
              {!isUser && <BubbleSpike kontur className="chat-bubble-spike chat-bubble-spike--under" />}
              <div className={cn("chat-bubble", isUser ? "chat-bubble--user" : "chat-bubble--assistant")}>
                {isUser ? (
                  (() => {
                    const { main, anbieter } = splitAnbieter(text);
                    return (
                      <>
                        <p className="chat-text">{main}</p>
                        {anbieter && (
                          <p className="chat-anbieter-tag">Anbieter: {anbieter}</p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className="chat-text chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text || (status === "submitted" ? "…" : "")}
                    </ReactMarkdown>
                    {showCursor && <span className="chat-cursor" aria-hidden>▍</span>}
                  </div>
                )}
                {!isUser && sources.length > 0 && (
                  <div className="chat-sources">
                    <span className="chat-sources-label">Quellen</span>
                    <ul>
                      {sources.map((s, i) => (
                        <li key={i}>
                          {s.title}
                          {s.pages ? <span className="chat-sources-pages"> · {s.pages}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <BubbleSpike />
              </div>
            </div>
          </div>
        );
      })}
      {error && (
        <div className="chat-row chat-row--assistant">
          <div className="chat-bubble-wrap">
            {/* Under-Spike mit brand-secondary stroke für continuous-outline-Effekt */}
            <BubbleSpike kontur className="chat-bubble-spike chat-bubble-spike--under chat-bubble-spike--under-error" />
            <div className="chat-bubble chat-bubble--error">
              <p className="chat-text">
                Leo macht gerade eine kurze Pause. Bitte in ein paar Sekunden erneut versuchen.
                <br />
                <span style={{ opacity: 0.7, fontSize: "0.85em" }}>
                  ({error.message.includes("429") || /quota|rate/i.test(error.message)
                    ? "Anfrage-Limit erreicht"
                    : error.message.slice(0, 120)})
                </span>
              </p>
              {/* Over-Spike (fill = page-bg) verdeckt Outline am Spike-Anschluss */}
              <BubbleSpike />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
