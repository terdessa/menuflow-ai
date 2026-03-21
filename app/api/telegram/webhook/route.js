import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  getFile,
  downloadFile,
  buildAllergyKeyboard,
  buildSpiceKeyboard,
  buildPreferencesKeyboard,
  getTelegramUser,
  upsertTelegramUser,
  extractPreferencesFromVoice,
} from '@/lib/telegram';

function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(process.env.DATABASE_URL);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Main webhook handler ────────────────────────────────────────

export async function POST(request) {
  // Always return 200 to Telegram immediately to prevent retries
  try {
    const body = await request.json();
    const sql = getSQL();

    // Handle callback queries (inline button taps)
    if (body.callback_query) {
      await handleCallbackQuery(sql, body.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle regular messages
    if (body.message) {
      await handleMessage(sql, body.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

// ─── Message handler ─────────────────────────────────────────────

async function handleMessage(sql, message) {
  const chatId = message.chat.id;
  const text = message.text?.trim() || '';

  // Ensure user exists
  let user = await getTelegramUser(sql, chatId);
  if (!user) {
    user = await upsertTelegramUser(sql, chatId, { state: 'new' });
  }

  // Handle commands
  if (text === '/start') {
    return startOnboarding(sql, chatId);
  }

  if (text === '/preferences') {
    return startOnboarding(sql, chatId);
  }

  if (text === '/help') {
    return sendMessage(
      chatId,
      '📸 <b>How to use MenuFlow AI Bot</b>\n\n' +
      '1. Set up your preferences (allergies, spice tolerance, excluded ingredients)\n' +
      '2. Send me a photo of a restaurant menu\n' +
      '3. I\'ll analyze it and send you a personalized link!\n\n' +
      '<b>Commands:</b>\n' +
      '/start - Start fresh\n' +
      '/preferences - Update your preferences\n' +
      '/help - Show this help'
    );
  }

  // Handle voice messages during onboarding
  if (message.voice && isOnboardingState(user.state)) {
    return handleVoiceOnboarding(sql, chatId, message);
  }

  // Handle state-specific text input
  if (user.state === 'new' || user.state === 'awaiting_allergies') {
    return startOnboarding(sql, chatId);
  }

  if (user.state === 'awaiting_excludes') {
    return handleExcludeIngredients(sql, chatId, text);
  }

  // If user is ready, handle photo or text
  if (user.state === 'ready') {
    if (message.photo && message.photo.length > 0) {
      return handlePhotoMessage(sql, chatId, message);
    }
    return sendMessage(
      chatId,
      '📷 Send me a photo of a restaurant menu and I\'ll analyze it for you!\n\n' +
      'Or use /preferences to update your settings.',
      buildPreferencesKeyboard()
    );
  }

  // Fallback for any other state with a photo
  if (message.photo && message.photo.length > 0) {
    if (user.state !== 'ready') {
      return sendMessage(
        chatId,
        '⚠️ Please complete your preference setup first!\n' +
        'Use /start to begin.'
      );
    }
    return handlePhotoMessage(sql, chatId, message);
  }

  // Unknown state, restart
  return startOnboarding(sql, chatId);
}

// ─── Onboarding flow ─────────────────────────────────────────────

async function startOnboarding(sql, chatId) {
  await upsertTelegramUser(sql, chatId, { state: 'awaiting_allergies', allergies: [] });

  return sendMessage(
    chatId,
    '👋 <b>Welcome to MenuFlow AI!</b>\n\n' +
    'I\'ll help you understand restaurant menus based on your dietary needs.\n\n' +
    '🎙 <b>Quick setup:</b> Send a voice message describing all your preferences at once!\n' +
    '<i>Example: "I\'m allergic to nuts and dairy, I like mild spice, and I don\'t eat mushrooms"</i>\n\n' +
    '— or —\n\n' +
    '🥜 <b>Step 1/3 — Select your allergies</b>\n' +
    'Tap to toggle, then press <b>Done</b> when finished:',
    buildAllergyKeyboard([])
  );
}

// ─── Callback query handler ──────────────────────────────────────

async function handleCallbackQuery(sql, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const callbackId = callbackQuery.id;

  let user = await getTelegramUser(sql, chatId);
  if (!user) {
    user = await upsertTelegramUser(sql, chatId, { state: 'new' });
  }

  // Handle preference restart command
  if (data === 'cmd:preferences') {
    await answerCallbackQuery(callbackId, 'Updating preferences...');
    return startOnboarding(sql, chatId);
  }

  // ─── Allergy selection ───────────────────────────────────────
  if (data.startsWith('allergy:')) {
    const value = data.replace('allergy:', '');

    if (value === 'done') {
      // Move to spice tolerance step
      await answerCallbackQuery(callbackId, 'Allergies saved!');
      await upsertTelegramUser(sql, chatId, { state: 'awaiting_spice' });

      const allergyList = user.allergies?.length > 0
        ? user.allergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
        : 'None';

      return editMessageText(
        chatId,
        messageId,
        `✅ <b>Allergies:</b> ${allergyList}\n\n` +
        '🌶 <b>Step 2/3 — Select your spice tolerance:</b>',
        buildSpiceKeyboard()
      );
    }

    if (value === 'none') {
      // Clear all allergies
      await upsertTelegramUser(sql, chatId, { allergies: [] });
      await answerCallbackQuery(callbackId, 'Cleared all allergies');
      return editMessageText(
        chatId,
        messageId,
        '🥜 <b>Step 1/3 — Select your allergies</b>\n' +
        'Tap to toggle, then press <b>Done</b> when finished:',
        buildAllergyKeyboard([])
      );
    }

    // Toggle allergy
    const currentAllergies = user.allergies || [];
    const updatedAllergies = currentAllergies.includes(value)
      ? currentAllergies.filter((a) => a !== value)
      : [...currentAllergies, value];

    await upsertTelegramUser(sql, chatId, { allergies: updatedAllergies });
    await answerCallbackQuery(callbackId, currentAllergies.includes(value) ? `Removed ${value}` : `Added ${value}`);

    return editMessageText(
      chatId,
      messageId,
      '🥜 <b>Step 1/3 — Select your allergies</b>\n' +
      'Tap to toggle, then press <b>Done</b> when finished:',
      buildAllergyKeyboard(updatedAllergies)
    );
  }

  // ─── Spice tolerance selection ───────────────────────────────
  if (data.startsWith('spice:')) {
    const spiceValue = data.replace('spice:', '');
    await answerCallbackQuery(callbackId, `Spice: ${spiceValue}`);
    await upsertTelegramUser(sql, chatId, {
      state: 'awaiting_excludes',
      spice_tolerance: spiceValue,
    });

    return editMessageText(
      chatId,
      messageId,
      `✅ <b>Spice tolerance:</b> ${spiceValue}\n\n` +
      '🚫 <b>Step 3/3 — Ingredients to exclude</b>\n\n' +
      'Type ingredients you want to avoid, separated by commas.\n' +
      'Example: <i>cilantro, mushrooms, olives</i>\n\n' +
      'Or send /skip if you have none.'
    );
  }

  await answerCallbackQuery(callbackId);
}

// ─── Exclude ingredients handler ─────────────────────────────────

async function handleExcludeIngredients(sql, chatId, text) {
  if (text === '/skip') {
    await upsertTelegramUser(sql, chatId, {
      state: 'ready',
      exclude_ingredients: [],
    });
  } else {
    const ingredients = text.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean);
    await upsertTelegramUser(sql, chatId, {
      state: 'ready',
      exclude_ingredients: ingredients,
    });
  }

  const user = await getTelegramUser(sql, chatId);
  const allergyList = user.allergies?.length > 0
    ? user.allergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
    : 'None';
  const excludeList = user.exclude_ingredients?.length > 0
    ? user.exclude_ingredients.join(', ')
    : 'None';

  return sendMessage(
    chatId,
    '🎉 <b>All set! Here\'s your profile:</b>\n\n' +
    `🥜 <b>Allergies:</b> ${allergyList}\n` +
    `🌶 <b>Spice tolerance:</b> ${user.spice_tolerance}\n` +
    `🚫 <b>Excluded ingredients:</b> ${excludeList}\n\n` +
    '📸 <b>Now send me a photo of a restaurant menu!</b>',
    buildPreferencesKeyboard()
  );
}

// ─── Voice onboarding handler ────────────────────────────────────

const ONBOARDING_STATES = ['new', 'awaiting_allergies', 'awaiting_spice', 'awaiting_excludes'];

function isOnboardingState(state) {
  return ONBOARDING_STATES.includes(state);
}

async function handleVoiceOnboarding(sql, chatId, message) {
  await sendMessage(chatId, '🎙 Processing your voice message...');

  try {
    const fileInfo = await getFile(message.voice.file_id);
    if (!fileInfo || !fileInfo.file_path) {
      return sendMessage(chatId, '❌ Could not download the voice message. Please try again.');
    }

    const audioBuffer = await downloadFile(fileInfo.file_path);
    const preferences = await extractPreferencesFromVoice(audioBuffer);

    // Apply all extracted preferences at once and skip to ready
    await upsertTelegramUser(sql, chatId, {
      state: 'ready',
      allergies: preferences.allergies,
      spice_tolerance: preferences.spice_tolerance,
      exclude_ingredients: preferences.exclude_ingredients,
    });

    const allergyList = preferences.allergies.length > 0
      ? preferences.allergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
      : 'None';
    const excludeList = preferences.exclude_ingredients.length > 0
      ? preferences.exclude_ingredients.join(', ')
      : 'None';

    return sendMessage(
      chatId,
      '🎙 <b>Got it from your voice!</b>\n\n' +
      `🥜 <b>Allergies:</b> ${allergyList}\n` +
      `🌶 <b>Spice tolerance:</b> ${preferences.spice_tolerance}\n` +
      `🚫 <b>Excluded ingredients:</b> ${excludeList}\n\n` +
      '📸 <b>Now send me a photo of a restaurant menu!</b>\n\n' +
      '<i>Not right? Use /preferences to adjust manually.</i>',
      buildPreferencesKeyboard()
    );
  } catch (error) {
    console.error('Voice onboarding error:', error);
    return sendMessage(
      chatId,
      '❌ Couldn\'t understand the voice message. Please try again or use the buttons above to set your preferences manually.'
    );
  }
}

// ─── Photo handler (menu processing) ─────────────────────────────

async function handlePhotoMessage(sql, chatId, message) {
  // Send "processing" message
  await sendMessage(chatId, '⏳ Processing your menu...');

  try {
    // Get highest resolution photo
    const photo = message.photo[message.photo.length - 1];
    const fileInfo = await getFile(photo.file_id);

    if (!fileInfo || !fileInfo.file_path) {
      return sendMessage(chatId, '❌ Could not download the photo. Please try again.');
    }

    // Download image
    const imageBuffer = await downloadFile(fileInfo.file_path);

    // Build FormData matching how the frontend sends to /api/process-menu
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('images', blob, 'menu.jpg');

    // Process menu via our API
    const processRes = await fetch(`${APP_URL}/api/process-menu`, {
      method: 'POST',
      body: formData,
    });

    if (!processRes.ok) {
      const errorText = await processRes.text();
      console.error('process-menu error:', errorText);
      return sendMessage(chatId, '❌ Failed to process the menu. Please try a clearer photo.');
    }

    const menuData = await processRes.json();

    if (menuData.error) {
      return sendMessage(chatId, `❌ ${menuData.error}`);
    }

    const menuContent = menuData.menu || menuData;

    // Save menu to database
    const saveRes = await fetch(`${APP_URL}/api/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantName: 'Telegram Upload',
        location: '',
        language: 'auto',
        menu: menuContent,
      }),
    });

    if (!saveRes.ok) {
      return sendMessage(chatId, '❌ Menu was processed but could not be saved. Please try again.');
    }

    const savedMenu = await saveRes.json();
    const menuId = savedMenu.id;
    const menuUrl = `${APP_URL}/?menu=${menuId}`;

    // Build personalized summary based on user's preferences
    const user = await getTelegramUser(sql, chatId);
    const summary = buildMenuSummary(menuContent, user);

    return sendMessage(
      chatId,
      `✅ <b>Menu analyzed!</b>\n\n${summary}\n\n` +
      `👉 <a href="${menuUrl}">View full menu with filters</a>`,
      buildPreferencesKeyboard()
    );
  } catch (error) {
    console.error('Photo processing error:', error);
    return sendMessage(chatId, '❌ Something went wrong processing your menu. Please try again.');
  }
}

// ─── Menu summary builder ────────────────────────────────────────

function buildMenuSummary(menu, user) {
  let totalDishes = 0;
  let safeCount = 0;
  let warningDishes = [];

  const userAllergies = user?.allergies || [];
  const userSpice = user?.spice_tolerance || 'medium';
  const userExcludes = user?.exclude_ingredients || [];
  const spiceLevels = ['none', 'mild', 'medium', 'hot', 'very-hot'];
  const userSpiceIndex = spiceLevels.indexOf(userSpice);

  Object.entries(menu).forEach(([section, dishes]) => {
    if (!Array.isArray(dishes)) return;
    dishes.forEach((dish) => {
      totalDishes++;
      const fp = dish.filterProperties || {};
      let isSafe = true;

      // Check allergies
      if (userAllergies.length > 0 && fp.allergies?.length > 0) {
        const matchingAllergens = userAllergies.filter((a) => fp.allergies.includes(a));
        if (matchingAllergens.length > 0) {
          isSafe = false;
          warningDishes.push(`⚠️ <b>${dish.name}</b> — contains ${matchingAllergens.join(', ')}`);
        }
      }

      // Check spice
      if (fp.spiceLevel) {
        const dishSpiceIndex = spiceLevels.indexOf(fp.spiceLevel);
        if (dishSpiceIndex > userSpiceIndex) {
          isSafe = false;
        }
      }

      // Check excluded ingredients
      if (userExcludes.length > 0 && dish.ingredients) {
        const ingredientsLower = dish.ingredients.toLowerCase();
        const found = userExcludes.filter((ex) => ingredientsLower.includes(ex));
        if (found.length > 0) {
          isSafe = false;
        }
      }

      if (isSafe) safeCount++;
    });
  });

  const lines = [`🍽 <b>${totalDishes} dishes</b> found`];

  if (userAllergies.length > 0 || userExcludes.length > 0) {
    lines.push(`✅ <b>${safeCount}</b> match your preferences`);
    if (totalDishes - safeCount > 0) {
      lines.push(`⚠️ <b>${totalDishes - safeCount}</b> flagged based on your filters`);
    }
  }

  // Show up to 5 allergy warnings
  if (warningDishes.length > 0) {
    lines.push('');
    lines.push('<b>Allergy alerts:</b>');
    warningDishes.slice(0, 5).forEach((w) => lines.push(w));
    if (warningDishes.length > 5) {
      lines.push(`...and ${warningDishes.length - 5} more`);
    }
  }

  return lines.join('\n');
}
