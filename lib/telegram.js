// Telegram Bot API helpers (server-side only)
// Uses Upstash Redis for telegram user state (consistent with menu-store.js)

const ALLERGIES = [
  'Nuts', 'Gluten', 'Dairy', 'Eggs', 'Seafood', 'Soy',
  'Shellfish', 'Sesame', 'Sulfites', 'Mustard', 'Celery', 'Lupin', 'Molluscs',
];

const SPICE_LEVELS = [
  { label: '🟢 No spice', value: 'none' },
  { label: '🟡 Mild', value: 'mild' },
  { label: '🟠 Medium', value: 'medium' },
  { label: '🔴 Hot', value: 'hot' },
  { label: '🌶 Very Hot', value: 'very-hot' },
];

function getToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function apiUrl(method) {
  return `https://api.telegram.org/bot${getToken()}/${method}`;
}

// ─── Upstash Redis helper (matches menu-store.js pattern) ────────

const redisRequest = async (command) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis not configured');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(data?.error || 'Redis request failed');
  }

  return data.result;
};

const tgUserKey = (chatId) => `tg_user:${chatId}`;

// ─── Telegram API helpers ────────────────────────────────────────

export async function sendMessage(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function answerCallbackQuery(callbackQueryId, text) {
  const res = await fetch(apiUrl('answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
  return res.json();
}

export async function editMessageReplyMarkup(chatId, messageId, replyMarkup) {
  const res = await fetch(apiUrl('editMessageReplyMarkup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    }),
  });
  return res.json();
}

export async function editMessageText(chatId, messageId, text, replyMarkup) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  const res = await fetch(apiUrl('editMessageText'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getFile(fileId) {
  const res = await fetch(apiUrl('getFile') + `?file_id=${fileId}`);
  const data = await res.json();
  return data.result;
}

export async function downloadFile(filePath) {
  const url = `https://api.telegram.org/file/bot${getToken()}/${filePath}`;
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Keyboard Builders ───────────────────────────────────────────

export function buildAllergyKeyboard(selectedAllergies = []) {
  const rows = [];
  for (let i = 0; i < ALLERGIES.length; i += 3) {
    const row = ALLERGIES.slice(i, i + 3).map((allergy) => {
      const isSelected = selectedAllergies.includes(allergy.toLowerCase());
      return {
        text: isSelected ? `✅ ${allergy}` : allergy,
        callback_data: `allergy:${allergy.toLowerCase()}`,
      };
    });
    rows.push(row);
  }
  rows.push([
    { text: '🚫 None', callback_data: 'allergy:none' },
    { text: '✅ Done', callback_data: 'allergy:done' },
  ]);
  return { inline_keyboard: rows };
}

export function buildSpiceKeyboard() {
  return {
    inline_keyboard: [
      SPICE_LEVELS.map((level) => ({
        text: level.label,
        callback_data: `spice:${level.value}`,
      })),
    ],
  };
}

export function buildPreferencesKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '⚙️ Update My Preferences', callback_data: 'cmd:preferences' }],
    ],
  };
}

// ─── Telegram user state (Upstash Redis) ─────────────────────────

export async function getTelegramUser(chatId) {
  const value = await redisRequest(['GET', tgUserKey(chatId)]);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function upsertTelegramUser(chatId, updates) {
  let user = await getTelegramUser(chatId);

  if (!user) {
    user = {
      chat_id: chatId,
      state: updates.state || 'new',
      allergies: updates.allergies || [],
      spice_tolerance: updates.spice_tolerance || 'medium',
      exclude_ingredients: updates.exclude_ingredients || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else {
    if (updates.state !== undefined) user.state = updates.state;
    if (updates.allergies !== undefined) user.allergies = updates.allergies;
    if (updates.spice_tolerance !== undefined) user.spice_tolerance = updates.spice_tolerance;
    if (updates.exclude_ingredients !== undefined) user.exclude_ingredients = updates.exclude_ingredients;
    user.updated_at = new Date().toISOString();
  }

  await redisRequest(['SET', tgUserKey(chatId), JSON.stringify(user)]);
  return user;
}

// ─── Voice preference extraction via Gemini ──────────────────────

export async function extractPreferencesFromVoice(audioBuffer) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  const audioBase64 = audioBuffer.toString('base64');

  const prompt = `Listen to this voice message. The user is describing their food preferences and dietary restrictions.

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):

{
  "allergies": [],
  "spice_tolerance": "medium",
  "exclude_ingredients": []
}

Rules:
- "allergies" must ONLY contain values from this list: ${ALLERGIES.map((a) => `"${a.toLowerCase()}"`).join(', ')}. Map what the user says to the closest match (e.g. "I can't eat nuts" → "nuts", "lactose intolerant" → "dairy", "no wheat" → "gluten").
- "spice_tolerance" must be exactly one of: "none", "mild", "medium", "hot", "very-hot". Interpret the user's words (e.g. "I don't like spicy food" → "none", "I love hot food" → "hot").
- "exclude_ingredients" is a free-form array of specific ingredients the user wants to avoid that aren't covered by allergies (e.g. "mushrooms", "cilantro", "olives"). Use lowercase.
- If the user doesn't mention a category, use these defaults: allergies=[], spice_tolerance="medium", exclude_ingredients=[].
- The user may speak in any language. Understand their intent regardless of language.

Return the JSON now:`;

  const result = await geminiModel.generateContent([
    prompt,
    {
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/ogg',
      },
    },
  ]);

  const response = await result.response;
  let text = response.text().trim();

  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(text);

  const validAllergies = ALLERGIES.map((a) => a.toLowerCase());
  const validSpice = ['none', 'mild', 'medium', 'hot', 'very-hot'];

  return {
    allergies: (parsed.allergies || []).filter((a) => validAllergies.includes(a)),
    spice_tolerance: validSpice.includes(parsed.spice_tolerance) ? parsed.spice_tolerance : 'medium',
    exclude_ingredients: (parsed.exclude_ingredients || []).map((i) => i.toLowerCase().trim()).filter(Boolean),
  };
}

export { ALLERGIES, SPICE_LEVELS };
