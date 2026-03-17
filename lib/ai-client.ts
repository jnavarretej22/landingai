import Groq from 'groq-sdk';

const USE_OLLAMA  = process.env.USE_OLLAMA  === 'true';
const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://localhost:11434';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_CHAT_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
const GROQ_CODE_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

// ── Timeout helper ───────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${label}, ${ms}ms)`)), ms)
    ),
  ]);
}

// ── Ollama (30s timeout) ─────────────────────────────────
async function callOllama(
  model: string,
  messages: Groq.Chat.ChatCompletionMessageParam[],
  maxTokens: number
): Promise<string> {
  const res = await withTimeout(
    fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.5, num_predict: maxTokens } }),
    }),
    30_000,
    'Ollama'
  );
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.message?.content || '';
}

// ── Groq (15s timeout, model fallback) ──────────────────
async function callGroq(
  models: string[],
  messages: Groq.Chat.ChatCompletionMessageParam[],
  maxTokens: number
): Promise<string> {
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  for (const model of models) {
    try {
      const res = await withTimeout(
        groq.chat.completions.create({
          model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.5,
        }),
        15_000,
        `Groq/${model}`
      );
      console.log(`✅ Provider: groq/${model}`);
      return res.choices[0]?.message?.content || '';
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error?.status === 429 || error?.message?.includes('rate')) {
        console.log(`⚠️ ${model} rate-limited, trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('GROQ_EXHAUSTED');
}

// ── Core dispatcher ──────────────────────────────────────
async function callWithFallback(
  ollamaModel: string,
  groqModels: string[],
  messages: Groq.Chat.ChatCompletionMessageParam[],
  maxTokens: number
): Promise<string> {
  if (!USE_OLLAMA) {
    try {
      return await callGroq(groqModels, messages, maxTokens);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === 'GROQ_EXHAUSTED') {
        console.log('⚠️ Groq exhausted — falling back to Ollama');
        return await callOllama(ollamaModel, messages, maxTokens);
      }
      throw err;
    }
  }
  return await callOllama(ollamaModel, messages, maxTokens);
}

// ── Public API ───────────────────────────────────────────
export async function callChatAI(
  messages: Groq.Chat.ChatCompletionMessageParam[]
): Promise<string> {
  return callWithFallback('llama3.2:3b', GROQ_CHAT_MODELS, messages, 1024);
}

export async function callGenerateAI(
  messages: Groq.Chat.ChatCompletionMessageParam[]
): Promise<string> {
  return callWithFallback('qwen2.5-coder:7b', GROQ_CODE_MODELS, messages, 2000);
}
