# LandingAI — Audit Changes Report
_Generated: 2026-03-16_

---

## A) Token Optimization

### What was broken
- `HTML_GENERATION_PROMPT` in `prompts.ts` was ~2,000 tokens of detailed HTML instructions that were **never used** (templates are pre-built HTML files).
- `extractBusinessInfo` sent the full conversation to the AI. Long chats used 3,000+ tokens just for extraction.
- Generation prompt in `route.ts` was ~700 tokens with verbose rule sections.

### What was fixed
| Prompt | Before | After | Saved |
|---|---|---|---|
| `HTML_GENERATION_PROMPT` | ~2,000 tokens | **Deleted** | 2,000 |
| `CHAT_SYSTEM_PROMPT` | ~180 tokens | ~120 tokens | 60 |
| Generation prompt | ~700 tokens | ~480 tokens | 220 |
| Extraction prompt | ~300 tokens (full history) | ~200 tokens (last 12 msgs) | 100 |

**Total estimated savings per request: ~2,300–2,500 tokens**

---

## B) Color & Design Compliance

### What was broken
- Light-colored **accent** colors (e.g., "amarillo claro" for buttons) incorrectly triggered full light-mode backgrounds.
- No server-side enforcement: if the AI returned a light `bg` color, it was used as-is.

### What was fixed
- Added `postProcess(data, businessInfo)` in `generate/route.ts` that:
  - Checks `businessInfo.bgColor` + `businessInfo.colors` against a regex for explicit light-mode keywords.
  - If no light-mode requested: forces `bg` dark, sets `textColor:#FFFFFF`, `mutedColor`, `navSolidBg`.
  - Auto-computes `btnText` based on accent lightness (`isLightColor()`).
  - Fills all required defaults (`whatsapp`, `businessInitials`, etc.)
- Added `bgColor` and `accentColor` as separate extracted fields to distinguish background vs. accent intentions.

---

## C) Image Handling

### What was fixed
- **Client-side compression** added in `ImageUploader.tsx`: images resized to max 800px, JPEG quality 0.8 via Canvas API before upload.
- **5MB server-side guard** added in `upload/route.ts`.
- Carousel injection regex was already correct — no change needed.
- About-section image injection from `images[0]` was already implemented.

---

## D) Chat Experience

### What was broken
- Trigger detection used exact string match: `"¡Perfecto! Ya tengo todo lo que necesito. Generando tu landing page..."` — any variation broke auto-generation.
- Responses appeared all at once.
- Errors showed raw `alert()` popups.

### What was fixed
- `detectReadySignal()` now checks 7 flexible patterns (both in `Chat.tsx` and `chat/route.ts`).
- Added **character-by-character typing animation** with a blinking cursor in `Chat.tsx`.
- Auto-generates when AI signals readiness (no need to click the button).
- Errors shown as assistant messages in chat (no more `alert()`).
- Bouncing ellipsis loading indicator while waiting for AI response.

---

## E) Template Selection

### What was broken
- `TEMPLATES` map pointed to `template-landing-v2.html` which was **deleted**.
- Templates weren't cached — `readFileSync` was called on every request.

### What was fixed
- `TEMPLATES.default` now points to `template-landing-v3.html`.
- All 6 templates are cached in `TEMPLATE_CACHE` at server startup (one `readFileSync` each, zero per-request reads).
- `templateStyle` rules are included in the generation prompt.
- Template selection occurs before `fillTemplate()`.
- Missing `{{BTN_TEXT_COLOR}}` placeholder now correctly mapped in `fillTemplate`.

---

## F) Error Handling & UX

### What was fixed
- All API routes now return consistent `{ success: bool, error: string, code: string }` JSON.
- Error codes: `'rate_limit'`, `'parse_error'`, `'template_error'`, `'upload_error'`.
- `Chat.tsx` maps each error code to a Spanish message shown inline.
- `PreviewFrame.tsx` shows an **animated skeleton** (navbar, hero, cards, footer) while `isGenerating = true`.

---

## G) Code Quality

### What was fixed
- Removed all `console.log` calls that exposed full API responses or keys; kept only provider info and error messages.
- Added **request timeouts**: 30s for Ollama, 15s for Groq (via `withTimeout()` helper).
- All `async` functions in `ai-client.ts` have proper `try/catch` with typed errors.
- Removed unused `provider` return value from `callChatAI` and `callGenerateAI` public APIs.
- Removed `alerts()` from `Chat.tsx` and `ImageUploader.tsx`.

---

## Remaining Issues (Not Auto-Fixed)

1. **`template-landing-v2.html` was deleted** but is still referenced in the open editor. No code references it anymore.
2. **Testimonial stars** are hardcoded in template HTML (`★★★★★`) — `fillTemplate` replaces text but not star ratings per testimonial. Low priority.
3. **`extractBusinessInfo` makes a separate AI call** before generation — this adds latency. Future optimization: extract from conversation client-side using regex/NLP heuristics and only call AI as fallback.
4. **No streaming** — AI responses arrive as one batch. Adding streaming would improve perceived latency significantly.
5. **No persistence** — chat history and generated HTML are lost on page refresh. Consider `localStorage` or a simple DB.

---

## Suggestions for Future Improvements

- **Streaming responses** via Next.js `StreamingTextResponse` for real-time chat.
- **Regenerate section** — instead of regenerating the full page, allow editing individual sections.
- **Template preview gallery** — let the user see and choose a template style before the AI decides.
- **Export to Vercel** — one-click deployment via Vercel API.
- **Rate limit bypass** — implement a simple queue (Redis/BullMQ) to auto-retry Groq requests without user action.
