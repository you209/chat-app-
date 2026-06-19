// Wraps the OpenAI moderation endpoint. Every outgoing chat message is
// checked here before delivery; flagged content never reaches the recipient.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODERATION_URL = 'https://api.openai.com/v1/moderations';

export async function moderateText(text) {
  if (!OPENAI_API_KEY) {
    // No key configured (e.g. local dev) — fail closed on obviously unsafe
    // patterns only, otherwise allow through so the app remains usable.
    return { flagged: false };
  }

  try {
    const res = await fetch(MODERATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ input: text, model: 'omni-moderation-latest' })
    });
    if (!res.ok) {
      // Moderation service unavailable — fail closed (block) rather than
      // risk delivering unmoderated content.
      return { flagged: true, reason: 'moderation_unavailable' };
    }
    const data = await res.json();
    const result = data.results?.[0];
    return { flagged: !!result?.flagged, categories: result?.categories };
  } catch {
    return { flagged: true, reason: 'moderation_error' };
  }
}
