import { NextResponse } from 'next/server';
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  getFile,
  downloadFile,
  buildAllergyKeyboard,
  buildSpiceKeyboard,
  buildDietKeyboard,
  buildPreferencesKeyboard,
  getTelegramUser,
  upsertTelegramUser,
  extractPreferencesFromVoice,
  getNextMissingStep,
  formatUserProfile,
} from '@/lib/telegram';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.callback_query) {
      await handleCallbackQuery(body.callback_query);
      return NextResponse.json({ ok: true });
    }

    if (body.message) {
      await handleMessage(body.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

const ONBOARDING_STATES = [
  'new', 'awaiting_allergies', 'awaiting_custom_allergies',
  'awaiting_spice', 'awaiting_diet', 'awaiting_excludes', 'awaiting_dish_prefs',
];

function isOnboardingState(state) {
  return ONBOARDING_STATES.includes(state);
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text?.trim() || '';
  const startPayload = text.startsWith('/start ') ? text.slice(7).trim() : null;

  let user = await getTelegramUser(chatId);
  if (!user) {
    user = await upsertTelegramUser(chatId, { state: 'new' });
  }

  if (startPayload?.startsWith('connect_')) {
    const menuId = startPayload.replace('connect_', '');
    await upsertTelegramUser(chatId, { pending_menu_id: menuId });

    if (user.state === 'ready') {
      const refreshedUser = await getTelegramUser(chatId);
      return sendProfileReadyMessage(chatId, refreshedUser, menuId);
    }
  }

  if (text === '/start') return startOnboarding(chatId);
  if (text === '/preferences') return startOnboarding(chatId);

  if (text === '/help') {
    return sendMessage(
      chatId,
      '📸 <b>How to use MenuFlow AI Bot</b>\n\n' +
      '1. Set up your preferences (allergies, spice, diet, etc.)\n' +
      '2. Send me a photo of a restaurant menu\n' +
      '3. I\'ll analyze it and send you both generic and personalized links.\n\n' +
      '<b>Commands:</b>\n' +
      '/start - Start fresh\n' +
      '/preferences - Update your preferences\n' +
      '/help - Show this help'
    );
  }

  if (message.voice && isOnboardingState(user.state)) {
    return handleVoiceOnboarding(chatId, message);
  }

  if (user.state === 'new' || user.state === 'awaiting_allergies') {
    return startOnboarding(chatId);
  }

  if (user.state === 'awaiting_custom_allergies') {
    return handleCustomAllergies(chatId, text);
  }

  if (user.state === 'awaiting_excludes') {
    return handleExcludeIngredients(chatId, text);
  }

  if (user.state === 'awaiting_dish_prefs') {
    return handleDishPreferences(chatId, text);
  }

  if (user.state === 'ready') {
    if (message.photo && message.photo.length > 0) {
      return handlePhotoMessage(chatId, message);
    }
    return sendMessage(
      chatId,
      '📷 Send me a photo of a restaurant menu and I\'ll analyze it for you!\n\n' +
      'Or use /preferences to update your settings.',
      buildPreferencesKeyboard()
    );
  }

  if (message.photo && message.photo.length > 0) {
    return sendMessage(
      chatId,
      '⚠️ Please complete your preference setup first!\nUse /start to begin.'
    );
  }

  return startOnboarding(chatId);
}

async function startOnboarding(chatId) {
  await upsertTelegramUser(chatId, {
    state: 'awaiting_allergies',
    allergies: [],
    custom_allergies: [],
    spice_tolerance: null,
    diet_type: null,
    exclude_ingredients: [],
    dish_preferences: [],
  });

  return sendMessage(
    chatId,
    '👋 <b>Welcome to MenuFlow AI!</b>\n\n' +
    'I\'ll help you understand restaurant menus based on your dietary needs.\n\n' +
    '🎙 <b>Quick setup:</b> Send a voice message answering these questions:\n' +
    '  1. Any food allergies?\n' +
    '  2. Spice tolerance? (none / mild / medium / hot / very hot / doesn\'t matter)\n' +
    '  3. Vegetarian or vegan?\n' +
    '  4. Any ingredients to avoid?\n' +
    '  5. Favourite types of dishes? (optional)\n\n' +
    '<i>Example: "I\'m allergic to nuts and dairy, I like mild spice, I\'m vegetarian, and I don\'t eat mushrooms"</i>\n\n' +
    '— or answer step by step —\n\n' +
    '🥜 <b>Step 1/5 — Select your allergies</b>\n' +
    'Tap to toggle, then press <b>Done</b>.\nHave a custom allergy? Tap <b>Type custom</b>.',
    buildAllergyKeyboard([])
  );
}

async function transitionToSpice(chatId) {
  await upsertTelegramUser(chatId, { state: 'awaiting_spice' });
  return sendMessage(
    chatId,
    '🌶 <b>Step 2/5 — Spice tolerance</b>\n' +
    'How spicy do you like your food?',
    buildSpiceKeyboard()
  );
}

async function transitionToDiet(chatId) {
  await upsertTelegramUser(chatId, { state: 'awaiting_diet' });
  return sendMessage(
    chatId,
    '🥬 <b>Step 3/5 — Dietary preference</b>\n' +
    'Are you vegetarian or vegan?',
    buildDietKeyboard()
  );
}

async function transitionToExcludes(chatId) {
  await upsertTelegramUser(chatId, { state: 'awaiting_excludes' });
  return sendMessage(
    chatId,
    '🚫 <b>Step 4/5 — Ingredients to exclude</b>\n\n' +
    'Type ingredients you want to avoid, separated by commas.\n' +
    'Example: <i>cilantro, mushrooms, olives</i>\n\n' +
    'Or send /skip if you have none.'
  );
}

async function transitionToDishPrefs(chatId) {
  await upsertTelegramUser(chatId, { state: 'awaiting_dish_prefs' });
  return sendMessage(
    chatId,
    '⭐️ <b>Step 5/5 — Dish preferences (optional)</b>\n\n' +
    'What types of dishes do you enjoy? This helps highlight recommendations.\n' +
    'Example: <i>pasta, grilled fish, salads, steak</i>\n\n' +
    'Or send /skip to finish.'
  );
}

async function transitionToReady(chatId) {
  await upsertTelegramUser(chatId, { state: 'ready' });
  const user = await getTelegramUser(chatId);
  return sendProfileReadyMessage(chatId, user, user.pending_menu_id);
}

async function sendProfileReadyMessage(chatId, user, menuId = null) {
  const genericMenuUrl = menuId ? `${APP_URL}/menu/${menuId}` : null;
  const personalizedMenuUrl =
    menuId && user.profile_token ? `${APP_URL}/menu/${menuId}/p/${user.profile_token}` : null;

  await upsertTelegramUser(chatId, { pending_menu_id: null });

  return sendMessage(
    chatId,
    '🎉 <b>All set! Here\'s your profile:</b>\n\n' +
    formatUserProfile(user) + '\n\n' +
    (personalizedMenuUrl
      ? `👉 <a href="${genericMenuUrl}">Open generic menu</a>\n` +
        `👉 <a href="${personalizedMenuUrl}">Open your personalized menu</a>\n\n`
      : '') +
    '📸 <b>Now send me a photo of a restaurant menu!</b>',
    buildPreferencesKeyboard()
  );
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const callbackId = callbackQuery.id;

  let user = await getTelegramUser(chatId);
  if (!user) {
    user = await upsertTelegramUser(chatId, { state: 'new' });
  }

  if (data === 'cmd:preferences') {
    await answerCallbackQuery(callbackId, 'Updating preferences...');
    return startOnboarding(chatId);
  }

  if (data.startsWith('allergy:')) {
    const value = data.replace('allergy:', '');

    if (value === 'done') {
      await answerCallbackQuery(callbackId, 'Allergies saved!');

      const allAllergies = [...(user.allergies || [])];
      if (user.custom_allergies?.length > 0) allAllergies.push(...user.custom_allergies);
      const allergyList = allAllergies.length > 0
        ? allAllergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
        : 'None';

      await editMessageText(
        chatId,
        messageId,
        `✅ <b>Allergies:</b> ${allergyList}`
      );

      return transitionToSpice(chatId);
    }

    if (value === 'none') {
      await upsertTelegramUser(chatId, { allergies: [], custom_allergies: [] });
      await answerCallbackQuery(callbackId, 'Cleared all allergies');
      return editMessageText(
        chatId,
        messageId,
        '🥜 <b>Step 1/5 — Select your allergies</b>\n' +
        'Tap to toggle, then press <b>Done</b>.\nHave a custom allergy? Tap <b>Type custom</b>.',
        buildAllergyKeyboard([])
      );
    }

    if (value === 'custom') {
      await answerCallbackQuery(callbackId, 'Type your custom allergies');
      await upsertTelegramUser(chatId, { state: 'awaiting_custom_allergies' });
      return sendMessage(
        chatId,
        '✏️ <b>Type your custom allergies</b>\n\n' +
        'Send them separated by commas.\n' +
        'Example: <i>kiwi, avocado, latex</i>'
      );
    }

    const currentAllergies = user.allergies || [];
    const updatedAllergies = currentAllergies.includes(value)
      ? currentAllergies.filter((a) => a !== value)
      : [...currentAllergies, value];

    await upsertTelegramUser(chatId, { allergies: updatedAllergies });
    await answerCallbackQuery(callbackId, currentAllergies.includes(value) ? `Removed ${value}` : `Added ${value}`);

    return editMessageText(
      chatId,
      messageId,
      '🥜 <b>Step 1/5 — Select your allergies</b>\n' +
      'Tap to toggle, then press <b>Done</b>.\nHave a custom allergy? Tap <b>Type custom</b>.',
      buildAllergyKeyboard(updatedAllergies)
    );
  }

  if (data.startsWith('spice:')) {
    const spiceValue = data.replace('spice:', '');
    await answerCallbackQuery(callbackId, spiceValue === 'any' ? 'No preference' : `Spice: ${spiceValue}`);
    await upsertTelegramUser(chatId, { spice_tolerance: spiceValue });

    const spiceLabel = spiceValue === 'any' ? 'Any (no preference)' : spiceValue;
    await editMessageText(
      chatId,
      messageId,
      `✅ <b>Spice tolerance:</b> ${spiceLabel}`
    );

    return transitionToDiet(chatId);
  }

  if (data.startsWith('diet:')) {
    const dietValue = data.replace('diet:', '');
    await answerCallbackQuery(callbackId, dietValue === 'none' ? 'No restriction' : dietValue);
    await upsertTelegramUser(chatId, { diet_type: dietValue });

    const dietLabel = dietValue === 'none' ? 'No restriction' : dietValue.charAt(0).toUpperCase() + dietValue.slice(1);
    await editMessageText(
      chatId,
      messageId,
      `✅ <b>Diet:</b> ${dietLabel}`
    );

    return transitionToExcludes(chatId);
  }

  await answerCallbackQuery(callbackId);
}

async function handleCustomAllergies(chatId, text) {
  const customs = text.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  const user = await getTelegramUser(chatId);
  const existingCustom = user.custom_allergies || [];
  const merged = [...new Set([...existingCustom, ...customs])];

  await upsertTelegramUser(chatId, {
    state: 'awaiting_allergies',
    custom_allergies: merged,
  });

  return sendMessage(
    chatId,
    `✅ Added custom allergies: <b>${customs.join(', ')}</b>\n\n` +
    'Continue selecting from the list or press <b>Done</b>:',
    buildAllergyKeyboard(user.allergies || [])
  );
}

async function handleExcludeIngredients(chatId, text) {
  if (text === '/skip') {
    await upsertTelegramUser(chatId, { exclude_ingredients: [] });
  } else {
    const ingredients = text.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean);
    await upsertTelegramUser(chatId, { exclude_ingredients: ingredients });
  }

  return transitionToDishPrefs(chatId);
}

async function handleDishPreferences(chatId, text) {
  if (text === '/skip') {
    await upsertTelegramUser(chatId, { dish_preferences: [] });
  } else {
    const prefs = text.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    await upsertTelegramUser(chatId, { dish_preferences: prefs });
  }

  return transitionToReady(chatId);
}

async function handleVoiceOnboarding(chatId, message) {
  await sendMessage(chatId, '🎙 Processing your voice message...');

  try {
    const fileInfo = await getFile(message.voice.file_id);
    if (!fileInfo || !fileInfo.file_path) {
      return sendMessage(chatId, '❌ Could not download the voice message. Please try again.');
    }

    const audioBuffer = await downloadFile(fileInfo.file_path);
    const prefs = await extractPreferencesFromVoice(audioBuffer);

    await upsertTelegramUser(chatId, {
      allergies: prefs.allergies,
      custom_allergies: prefs.custom_allergies,
      spice_tolerance: prefs.spice_tolerance,
      diet_type: prefs.diet_type,
      exclude_ingredients: prefs.exclude_ingredients,
      dish_preferences: prefs.dish_preferences,
    });

    const user = await getTelegramUser(chatId);
    const nextStep = getNextMissingStep(user);

    if (nextStep === 'ready') {
      await upsertTelegramUser(chatId, { state: 'ready' });
      const refreshedUser = await getTelegramUser(chatId);
      return sendProfileReadyMessage(chatId, refreshedUser, refreshedUser.pending_menu_id);
    }

    const extractedMsg = '🎙 <b>Got some preferences from your voice!</b>\n\n' +
      formatUserProfile(user) + '\n\n' +
      'Let me ask about the rest:\n\n';

    await sendMessage(chatId, extractedMsg);

    if (nextStep === 'awaiting_spice') {
      return transitionToSpice(chatId);
    }
    if (nextStep === 'awaiting_diet') {
      return transitionToDiet(chatId);
    }

    return transitionToReady(chatId);
  } catch (error) {
    console.error('Voice onboarding error:', error);
    return sendMessage(
      chatId,
      '❌ Couldn\'t understand the voice message. Please try again or use the buttons to set your preferences manually.'
    );
  }
}

async function handlePhotoMessage(chatId, message) {
  await sendMessage(chatId, '⏳ Processing your menu...');

  try {
    const photo = message.photo[message.photo.length - 1];
    const fileInfo = await getFile(photo.file_id);

    if (!fileInfo || !fileInfo.file_path) {
      return sendMessage(chatId, '❌ Could not download the photo. Please try again.');
    }

    const imageBuffer = await downloadFile(fileInfo.file_path);

    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('images', blob, 'menu.jpg');

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

    const saveData = await saveRes.json();
    const savedMenu = saveData.menu || saveData;
    const menuId = savedMenu.id;
    const menuUrl = `${APP_URL}/menu/${menuId}`;

    const user = await getTelegramUser(chatId);
    const summary = buildMenuSummary(menuContent, user);
    const personalizedUrl = user?.profile_token
      ? `${APP_URL}/menu/${menuId}/p/${user.profile_token}`
      : null;

    return sendMessage(
      chatId,
      `✅ <b>Menu analyzed!</b>\n\n${summary}\n\n` +
      `👉 <a href="${menuUrl}">Open generic menu</a>\n` +
      (personalizedUrl
        ? `👉 <a href="${personalizedUrl}">Open your personalized menu</a>\n`
        : '') +
      `🔐 <b>Your profile code:</b> <code>${user?.profile_token || 'Unavailable'}</code>`,
      buildPreferencesKeyboard()
    );
  } catch (error) {
    console.error('Photo processing error:', error);
    return sendMessage(chatId, '❌ Something went wrong processing your menu. Please try again.');
  }
}

function buildMenuSummary(menu, user) {
  let totalDishes = 0;
  let safeCount = 0;
  const warningDishes = [];

  const userAllergies = [
    ...(user?.allergies || []),
    ...(user?.custom_allergies || []),
  ];
  const userSpice = user?.spice_tolerance || 'medium';
  const userExcludes = user?.exclude_ingredients || [];
  const spiceLevels = ['none', 'mild', 'medium', 'hot', 'very-hot'];
  const userSpiceIndex = spiceLevels.indexOf(userSpice);

  Object.entries(menu).forEach(([, dishes]) => {
    if (!Array.isArray(dishes)) return;
    dishes.forEach((dish) => {
      totalDishes++;
      const fp = dish.filterProperties || {};
      let isSafe = true;

      if (userAllergies.length > 0 && fp.allergies?.length > 0) {
        const matchingAllergens = userAllergies.filter((a) => fp.allergies.includes(a));
        if (matchingAllergens.length > 0) {
          isSafe = false;
          warningDishes.push(`⚠️ <b>${dish.name}</b> — contains ${matchingAllergens.join(', ')}`);
        }
      }

      if (fp.spiceLevel && userSpice !== 'any') {
        const dishSpiceIndex = spiceLevels.indexOf(fp.spiceLevel);
        if (dishSpiceIndex > userSpiceIndex) {
          isSafe = false;
        }
      }

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

  if (warningDishes.length > 0) {
    lines.push('');
    lines.push('<b>Allergy alerts:</b>');
    warningDishes.slice(0, 5).forEach((warning) => lines.push(warning));
    if (warningDishes.length > 5) {
      lines.push(`...and ${warningDishes.length - 5} more`);
    }
  }

  return lines.join('\n');
}
