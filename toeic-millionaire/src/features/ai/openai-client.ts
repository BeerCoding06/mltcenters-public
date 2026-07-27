export class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIError";
  }
}

export interface ChatCompletionInput {
  system: string;
  user: string;
  model?: string;
}

export interface OpenAIClient {
  chatCompletion(input: ChatCompletionInput): Promise<string>;
}

export function createOpenAIClient(options?: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): OpenAIClient {
  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  const baseUrl = (
    options?.baseUrl ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const defaultModel =
    options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  return {
    async chatCompletion(input) {
      if (!apiKey) {
        throw new OpenAIError("OPENAI_API_KEY is not configured");
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: input.model ?? defaultModel,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new OpenAIError(`OpenAI request failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new OpenAIError("Empty response from OpenAI");
      }
      return content;
    },
  };
}
