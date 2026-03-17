import { Message, BusinessInfo } from './types';

export const CHAT_SYSTEM_PROMPT = `Eres MiNegocioDigital, un asistente experto en diseño web.
Tu objetivo: reunir la info necesaria para crear una landing page.
IDIOMA: Siempre en español. Tono cálido y entusiasta.

Pregunta sobre estos temas UNO A LA VEZ:
1. Nombre del negocio e industria
2. Producto/servicio principal y público objetivo
3. Diferenciador clave
4. Colores: "¿Prefieres el fondo oscuro (moderno y elegante) o claro (blanco, amarillo, crema)?"
5. Número de WhatsApp
6. Antes de cerrar, pregunta: "¿Deseas agregar un logo a tu página? Puedes subirlo en el panel lateral." y registra su respuesta.

Cuando tengas suficiente info (al menos nombre, industria y producto), termina EXACTAMENTE con:
"¡Perfecto! Ya tengo todo lo que necesito. Generando tu landing page..."`;

// HTML_GENERATION_PROMPT removed — no longer used (templates are pre-built)

export async function extractBusinessInfo(messages: Message[]): Promise<BusinessInfo> {
  const context = messages
    .slice(-12) // only last 12 messages to reduce tokens
    .map(m => `${m.role === 'user' ? 'Usuario' : 'IA'}: ${m.content}`)
    .join('\n');

  const prompt = `Extrae la info del negocio de esta conversación. Responde SOLO JSON, sin markdown.
Conversación:
${context}

JSON requerido (usa "" si falta un campo):
{"name":"","industry":"","product":"","audience":"","differentiator":"","colors":"(verbatim del usuario)","bgColor":"(color de fondo pedido, ej: blanco, azul cobalto, oscuro)","accentColor":"(color de acento/botones pedido)","whatsapp":"","phone":"","email":"","tone":"profesional"}`;

  const { callGenerateAI } = await import('./ai-client');
  const content = await callGenerateAI([{ role: 'user', content: prompt }]);
  const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(clean) as BusinessInfo;
  } catch {
    return {} as BusinessInfo;
  }
}
