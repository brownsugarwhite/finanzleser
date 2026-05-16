import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { getChatModel } from "@/lib/ai/provider";
import { LEO_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: getChatModel(),
      system: LEO_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
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
