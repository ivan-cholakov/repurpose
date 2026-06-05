import Anthropic from "@anthropic-ai/sdk";

export const FORMATS = {
  thread: {
    label: "X / Twitter thread",
    instruction:
      "A punchy 5-8 tweet thread. First tweet is a strong hook. Each tweet stands alone, < 280 chars, numbered like 1/, 2/. End with a takeaway. No hashtags unless essential.",
  },
  linkedin: {
    label: "LinkedIn post",
    instruction:
      "A professional but personable LinkedIn post (~150-250 words). Strong first line hook, short punchy paragraphs with line breaks, a clear insight, and a question to drive comments. Minimal emojis.",
  },
  newsletter: {
    label: "Newsletter blurb",
    instruction:
      "A warm, conversational newsletter section (~200 words) with a subject-line suggestion at the top, then the body. Friendly, direct, value-first.",
  },
  tldr: {
    label: "TL;DR summary",
    instruction:
      "A tight TL;DR: one-sentence summary followed by 3-5 crisp bullet points of the key takeaways.",
  },
  instagram: {
    label: "Instagram caption",
    instruction:
      "An Instagram caption (~100-150 words): a scroll-stopping first line, short evocative paragraphs, a clear call-to-action, and 3-5 relevant hashtags on the final line.",
  },
  youtube: {
    label: "YouTube description",
    instruction:
      "A YouTube video description: a 1-2 sentence hook summarizing the value, a short overview paragraph, a bulleted list of key points as chapter-style highlights, and a closing call-to-action to like/subscribe. No timestamps (the video doesn't exist yet).",
  },
} as const;

export type FormatId = keyof typeof FORMATS;

export function isValidFormat(f: string): f is FormatId {
  return f in FORMATS;
}

export interface RepurposeResult {
  format: FormatId;
  label: string;
  content: string;
}

const MODEL = "claude-sonnet-4-6";

const BASE_SYSTEM =
  "You are an expert content repurposing assistant. You take long-form source content and rewrite it faithfully into a specific target format. Preserve the author's facts and intent. Output ONLY the finished content, with no preamble, no explanation, and no surrounding quotes or markdown code fences.";

/** Progress events emitted while streaming a generation (NDJSON over HTTP). */
export type RepurposeStreamEvent =
  | { type: "start"; format: FormatId; label: string }
  | { type: "delta"; format: FormatId; text: string }
  | { type: "done"; format: FormatId }
  | { type: "complete"; usage: { used: number; limit: number } }
  | { type: "error"; error: string };

function makeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function systemPrompt(voiceNotes?: string | null): string {
  return voiceNotes?.trim()
    ? `${BASE_SYSTEM}\n\nThe author has described their voice and style. Match it closely in every output:\n${voiceNotes.trim()}`
    : BASE_SYSTEM;
}

function userPrompt(source: string, format: FormatId): string {
  return `Repurpose the following source content into this format:\n\n${FORMATS[format].instruction}\n\n--- SOURCE CONTENT ---\n${source}\n--- END SOURCE ---`;
}

export async function repurpose(
  source: string,
  formats: FormatId[],
  voiceNotes?: string | null,
): Promise<RepurposeResult[]> {
  const client = makeClient();
  const system = systemPrompt(voiceNotes);

  // One call per format, run concurrently, for cleaner separated output.
  const tasks = formats.map(async (format) => {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: userPrompt(source, format) }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return { format, label: FORMATS[format].label, content: text };
  });

  return Promise.all(tasks);
}

/**
 * Streaming variant: emits progress events while all formats generate
 * concurrently, and resolves with the same results as repurpose().
 */
export async function repurposeStreaming(
  source: string,
  formats: FormatId[],
  voiceNotes: string | null | undefined,
  emit: (event: RepurposeStreamEvent) => void,
): Promise<RepurposeResult[]> {
  const client = makeClient();
  const system = systemPrompt(voiceNotes);

  const tasks = formats.map(async (format) => {
    emit({ type: "start", format, label: FORMATS[format].label });

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: userPrompt(source, format) }],
    });
    stream.on("text", (text) => emit({ type: "delta", format, text }));

    const message = await stream.finalMessage();
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    emit({ type: "done", format });
    return { format, label: FORMATS[format].label, content: text };
  });

  return Promise.all(tasks);
}
