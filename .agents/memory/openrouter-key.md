---
name: OpenRouter key detection
description: The OPENAI_API_KEY secret in this project is an OpenRouter key, not a real OpenAI key.
---

The user's `OPENAI_API_KEY` environment secret is an OpenRouter key (prefix `sk-or-v1`). Sending it directly to the OpenAI API returns a 401.

**Fix:** Detect the key prefix at runtime and conditionally set `baseURL: "https://openrouter.ai/api/v1"` on the OpenAI client:
```ts
const apiKey = process.env.OPENAI_API_KEY ?? "";
const isOpenRouter = apiKey.startsWith("sk-or-");
const openai = new OpenAI({ apiKey, ...(isOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }) });
```

**Why:** OpenRouter is OpenAI SDK-compatible but requires its own base URL. Model names like `gpt-4o-mini` work the same through OpenRouter.

**How to apply:** Any new AI feature using the OpenAI SDK should include this detection pattern.
