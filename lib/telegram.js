// Telegram Bot API helpers (server-side only)
// Uses Upstash Redis for telegram user state (consistent with menu-store.js)

import crypto from 'crypto';

const PROFILE_COOKIE_NAME = 'menuflow_profile_token';

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

const DIET_TYPES = [
  { label: '🥬 Vegetarian', value: 'vegetarian' },
  { label: '🌱 Vegan', value: 'vegan' },
  { label: '🍽 No restriction', value: 'none' },
];

function getToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function apiUrl(method) {
  return `https://api.telegram.org/bot${getToken()}/${method}`;
}

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
const tgProfileKey = (token) => `tg_profile:${token}`;

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
    { text: '✏️ Type custom', callback_data: 'allergy:custom' },
  ]);
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
      [{ text: '🤷 Doesn\'t matter', callback_data: 'spice:any' }],
    ],
  };
}

export function buildDietKeyboard() {
  return {
    inline_keyboard: [
      DIET_TYPES.map((diet) => ({
        text: diet.label,
        callback_data: `diet:${diet.value}`,
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

const DEFAULT_USER = {
  state: 'new',
  allergies: [],
  custom_allergies: [],
  spice_tolerance: null,
  diet_type: null,
  exclude_ingredients: [],
  dish_preferences: [],
  pending_menu_id: null,
};

export async function getTelegramUser(chatId) {
  const value = await redisRequest(['GET', tgUserKey(chatId)]);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function getTelegramUserByProfileToken(token) {
  const chatId = await redisRequest(['GET', tgProfileKey(token)]);
  if (!chatId) return null;
  return getTelegramUser(chatId);
}

const ensureProfileToken = async (user) => {
  if (user.profile_token) {
    await redisRequest(['SET', tgProfileKey(user.profile_token), String(user.chat_id)]);
    return user.profile_token;
  }

  const profileToken = crypto.randomBytes(6).toString('hex').toUpperCase();
  user.profile_token = profileToken;
  await redisRequest(['SET', tgProfileKey(profileToken), String(user.chat_id)]);
  return profileToken;
};

export async function upsertTelegramUser(chatId, updates) {
  let user = await getTelegramUser(chatId);

  if (!user) {
    user = {
      chat_id: chatId,
      ...DEFAULT_USER,
      ...updates,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else {
    for (const key of Object.keys(updates)) {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    }
    user.updated_at = new Date().toISOString();
  }

  await ensureProfileToken(user);
  await redisRequest(['SET', tgUserKey(chatId), JSON.stringify(user)]);
  return user;
}

export function getNextMissingStep(user) {
  if (user.spice_tolerance === null || user.spice_tolerance === undefined) return 'awaiting_spice';
  if (user.diet_type === null || user.diet_type === undefined) return 'awaiting_diet';
  return 'ready';
}

export function formatUserProfile(user) {
  const allAllergies = [...(user.allergies || [])];
  if (user.custom_allergies?.length > 0) {
    allAllergies.push(...user.custom_allergies);
  }
  const allergyList = allAllergies.length > 0
    ? allAllergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
    : 'None';

  const spiceLabel = user.spice_tolerance === 'any'
    ? 'Any (no preference)'
    : user.spice_tolerance || 'Not set';

  const dietLabel = user.diet_type === 'none' || !user.diet_type
    ? 'No restriction'
    : user.diet_type.charAt(0).toUpperCase() + user.diet_type.slice(1);

  const excludeList = user.exclude_ingredients?.length > 0
    ? user.exclude_ingredients.join(', ')
    : 'None';

  const dishPrefList = user.dish_preferences?.length > 0
    ? user.dish_preferences.join(', ')
    : 'None';

  return (
    `🥜 <b>Allergies:</b> ${allergyList}\n` +
    `🌶 <b>Spice tolerance:</b> ${spiceLabel}\n` +
    `🥬 <b>Diet:</b> ${dietLabel}\n` +
    `🚫 <b>Excluded ingredients:</b> ${excludeList}\n` +
    `⭐️ <b>Dish preferences:</b> ${dishPrefList}\n` +
    `🔐 <b>Your profile code:</b> <code>${user.profile_token || 'Unavailable'}</code>`
  );
}

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
  "custom_allergies": [],
  "spice_tolerance": null,
  "diet_type": null,
  "exclude_ingredients": [],
  "dish_preferences": []
}

Rules:
- "allergies" must ONLY contain values from this list: ${ALLERGIES.map((a) => `"${a.toLowerCase()}"`).join(', ')}. Map what the user says to the closest match (e.g. "I can't eat nuts" → "nuts", "lactose intolerant" → "dairy", "no wheat" → "gluten").
- "custom_allergies" — any allergies the user mentions that do NOT match the standard list above. Put them here as lowercase strings.
- "spice_tolerance" — ONLY set this if the user EXPLICITLY mentions spice/spiciness. Must be exactly one of: "none", "mild", "medium", "hot", "very-hot", or "any" (if they say it doesn't matter). If the user does NOT mention spice at all, return null.
- "diet_type" — ONLY set this if the user EXPLICITLY mentions being vegetarian or vegan. Must be exactly "vegetarian", "vegan", or "none" (if they explicitly say no restriction). If not mentioned, return null.
- "exclude_ingredients" — specific ingredients the user wants to avoid that aren't covered by allergies (e.g. "mushrooms", "cilantro", "olives"). Use lowercase.
- "dish_preferences" — types of dishes the user likes or prefers (e.g. "pasta", "grilled fish", "salads"). Use lowercase. If not mentioned, return [].
- If the user doesn't mention a category, use null (for spice/diet) or [] (for arrays).
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
  const validSpice = ['none', 'mild', 'medium', 'hot', 'very-hot', 'any'];
  const validDiet = ['vegetarian', 'vegan', 'none'];

  return {
    allergies: (parsed.allergies || []).filter((a) => validAllergies.includes(a)),
    custom_allergies: (parsed.custom_allergies || []).map((a) => a.toLowerCase().trim()).filter(Boolean),
    spice_tolerance: validSpice.includes(parsed.spice_tolerance) ? parsed.spice_tolerance : null,
    diet_type: validDiet.includes(parsed.diet_type) ? parsed.diet_type : null,
    exclude_ingredients: (parsed.exclude_ingredients || []).map((i) => i.toLowerCase().trim()).filter(Boolean),
    dish_preferences: (parsed.dish_preferences || []).map((d) => d.toLowerCase().trim()).filter(Boolean),
  };
}

export const getProfileTokenFromRequest = (request) =>
  request.cookies.get(PROFILE_COOKIE_NAME)?.value || null;

export const attachProfileCookie = (response, profileToken) => {
  response.cookies.set(PROFILE_COOKIE_NAME, profileToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
};

export { ALLERGIES, DIET_TYPES, PROFILE_COOKIE_NAME, SPICE_LEVELS };
