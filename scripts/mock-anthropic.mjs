// Minimal mock of the Anthropic Messages API (streaming + non-streaming) for
// local demos and captures. Usage:
//   node scripts/mock-anthropic.mjs            # listens on :4545
//   ANTHROPIC_BASE_URL=http://localhost:4545 ANTHROPIC_API_KEY=mock pnpm dev
import http from "node:http";

const REPLIES = {
  thread:
    "1/ Productivity isn't about doing more. It's about subtraction.\n\n2/ Cut the work that doesn't matter so the work that does has room to breathe.\n\n3/ One outcome per day. Batched shallow work. A weekly review that deletes commitments.\n\n4/ Busyness is a form of laziness. Do less, ship what matters.",
  linkedin:
    "Most people think productivity is doing more, faster.\n\nAfter years of chasing apps and frameworks, I learned the real lever is subtraction.\n\nThree shifts changed everything:\n→ One outcome per day\n→ Shallow work in two fixed windows\n→ A weekly review that deletes commitments\n\nWhat's one commitment you could delete this week?",
  default:
    "Here is the repurposed content, faithful to the source and tuned to the requested format.",
};

function pickReply(body) {
  const text = JSON.stringify(body).toLowerCase();
  if (text.includes("tweet")) return REPLIES.thread;
  if (text.includes("linkedin")) return REPLIES.linkedin;
  return REPLIES.default;
}

const server = http.createServer(async (req, res) => {
  // Health check for Playwright's webServer readiness probe (404 won't do).
  if (req.method === "GET") {
    res.writeHead(200).end("ok");
    return;
  }
  if (req.method !== "POST" || !req.url.includes("/messages")) {
    res.writeHead(404).end();
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  const reply = pickReply(body);

  if (!body.stream) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_mock",
        type: "message",
        role: "assistant",
        model: body.model,
        content: [{ type: "text", text: reply }],
        stop_reason: "end_turn",
        usage: { input_tokens: 100, output_tokens: 100 },
      }),
    );
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send("message_start", {
    type: "message_start",
    message: {
      id: "msg_mock",
      type: "message",
      role: "assistant",
      model: body.model,
      content: [],
      stop_reason: null,
      usage: { input_tokens: 100, output_tokens: 0 },
    },
  });
  send("content_block_start", {
    type: "content_block_start",
    index: 0,
    content_block: { type: "text", text: "" },
  });

  // Drip the reply out in word chunks so streaming is visible.
  const words = reply.split(/(?<=\s)/);
  for (const word of words) {
    send("content_block_delta", {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: word },
    });
    await new Promise((r) => setTimeout(r, 35));
  }

  send("content_block_stop", { type: "content_block_stop", index: 0 });
  send("message_delta", {
    type: "message_delta",
    delta: { stop_reason: "end_turn", stop_sequence: null },
    usage: { output_tokens: words.length },
  });
  send("message_stop", { type: "message_stop" });
  res.end();
});

server.listen(4545, () => console.log("mock anthropic on :4545"));
