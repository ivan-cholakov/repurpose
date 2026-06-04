import { z } from "zod";

// Output formats the repurpose endpoint understands. Kept here (not in repurpose.ts)
// so client and validation code can import it without pulling in the Anthropic SDK.
export const FORMAT_IDS = ["thread", "linkedin", "newsletter", "tldr"] as const;
export const formatSchema = z.enum(FORMAT_IDS);
export type FormatId = (typeof FORMAT_IDS)[number];

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Please enter a valid email." }));

export const signupSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(200),
});

// Hard upper bound; per-plan limits are enforced separately in the route.
export const MAX_SOURCE_CHARS = 100_000;

export const repurposeSchema = z.object({
  source: z
    .string()
    .trim()
    .min(50, "Please paste at least 50 characters of source content.")
    .max(MAX_SOURCE_CHARS, "Source content is too long."),
  formats: z
    .array(formatSchema)
    .min(1, "Select at least one output format.")
    .max(FORMAT_IDS.length),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RepurposeInput = z.infer<typeof repurposeSchema>;

/**
 * Parse an incoming JSON request against a Zod schema.
 * Returns either the typed data or a flat list of error messages.
 */
export async function parseJson<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; errors: string[] }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, errors: ["Request body must be valid JSON."] };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => i.message) };
  }
  return { ok: true, data: result.data };
}
