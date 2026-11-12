import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentProviderError, pickProvider, runShoppingAgent } from "@/lib/agent";

const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(20)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", {
      message: "Conversation must start and end with a user message",
    }),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
  }

  if (pickProvider() === null) {
    return NextResponse.json(
      { error: "No AI key is set. Add GROQ_API_KEY, GEMINI_API_KEY or OPENROUTER_API_KEY (all free) to .env.local and restart the server." },
      { status: 503 }
    );
  }

  try {
    const result = await runShoppingAgent(parsed.data.messages);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent error:", error);

    if (error instanceof AgentProviderError && error.provider !== "anthropic") {
      const names = { groq: ["Groq", "GROQ"], gemini: ["Gemini", "GEMINI"], openrouter: ["OpenRouter", "OPENROUTER"] } as const;
      const [name, prefix] = names[error.provider];
      const env = `${prefix}_API_KEY`;
      if (error.status === 401) {
        return NextResponse.json(
          { error: `${name} API key is missing or invalid. Check ${env} in your environment variables and restart or redeploy.` },
          { status: 503 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: `The free ${name} limit was reached. Wait a minute and try again.` },
          { status: 429 }
        );
      }
      if (error.status === 404) {
        return NextResponse.json(
          { error: `${name} doesn't know that model. Check ${prefix}_MODEL in your environment variables.` },
          { status: 502 }
        );
      }
      return NextResponse.json({ error: "The shopping agent could not respond." }, { status: 502 });
    }

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Claude API key is missing or invalid. Add ANTHROPIC_API_KEY to .env.local." },
        { status: 503 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "The shopping agent is busy. Try again in a moment." },
        { status: 429 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "The shopping agent could not respond." },
        { status: 502 }
      );
    }
    if (
      error instanceof Anthropic.AnthropicError ||
      (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)
    ) {
      // Raised before any request is sent, for example when no API key is configured.
      return NextResponse.json(
        { error: "No AI key is set. Add GROQ_API_KEY (free) or ANTHROPIC_API_KEY to .env.local and restart the server." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Shopping agent failed" }, { status: 500 });
  }
}
