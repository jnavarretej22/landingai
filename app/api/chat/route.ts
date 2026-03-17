import Groq from 'groq-sdk';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

const READY_PATTERNS = [
  'generando tu landing page',
  'creando tu página',
  'lista para generar',
  'suficiente información',
  'voy a crear',
  'generaré tu',
  'ya tengo todo lo que necesito',
];

function detectReadySignal(text: string): boolean {
  const lower = text.toLowerCase();
  return READY_PATTERNS.some(p => lower.includes(p));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const allMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ...messages,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (process.env.USE_OLLAMA === 'true') {
          // ── Ollama streaming ─────────────────────────────
          const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
          const response  = await fetch(`${ollamaUrl}/api/chat`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ model: 'llama3.2:3b', messages: allMessages, stream: true }),
          });

          if (!response.ok || !response.body) {
            throw new Error(`Ollama error: ${response.status}`);
          }

          const reader  = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText  = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n').filter(Boolean)) {
              try {
                const json  = JSON.parse(line);
                const token = json.message?.content || '';
                if (token) {
                  fullText += token;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`)
                  );
                }
              } catch { /* ignore malformed lines */ }
            }
          }

          const isReady = detectReadySignal(fullText);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token: '', done: true, isReady })}\n\n`)
          );

        } else {
          // ── Groq streaming (with model fallback) ─────────
          const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
          const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

          let succeeded = false;

          for (const model of models) {
            try {
              const groqStream = await groq.chat.completions.create({
                model,
                messages: allMessages,
                max_tokens: 1024,
                temperature: 0.5,
                stream: true,
              });

              let fullText = '';
              for await (const chunk of groqStream) {
                const token = chunk.choices[0]?.delta?.content || '';
                if (token) {
                  fullText += token;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`)
                  );
                }
              }

              const isReady = detectReadySignal(fullText);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: '', done: true, isReady })}\n\n`)
              );

              succeeded = true;
              break;

            } catch (err: unknown) {
              const error = err as { status?: number; message?: string };
              if (error?.status === 429 || error?.message?.includes('rate')) {
                console.log(`⚠️ Groq ${model} rate-limited, trying next model...`);
                continue;
              }
              throw err;
            }
          }

          if (!succeeded) {
            throw new Error('Todos los modelos de Groq alcanzaron el límite de uso.');
          }
        }

      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        const isRateLimit = error?.status === 429 || error?.message?.includes('rate') || error?.message?.includes('límite');
        console.error('Chat stream error:', error?.message);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error:    isRateLimit ? 'Servicio ocupado. Espera un momento e intenta de nuevo.' : 'Error al procesar tu mensaje.',
              code:     isRateLimit ? 'rate_limit' : 'parse_error',
              done:     true,
              isReady:  false,
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
