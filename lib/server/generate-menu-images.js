import { GoogleGenAI } from '@google/genai';
import { getMenuRecord, updateMenuRecordInternal } from '@/lib/server/menu-store';

const styleDescriptions = {
  minimalistic: 'flat icon, simple, clean',
  simple: 'casual restaurant photo, ambient indoor light, natural colors, unretouched',
  detailed:
    'candid restaurant snapshot, ambient indoor light, natural colors, unretouched, slight imperfections',
};

const getImageProgress = (menu) => {
  let total = 0;
  let completed = 0;

  for (const dishes of Object.values(menu || {})) {
    if (!Array.isArray(dishes)) continue;

    total += dishes.length;
    completed += dishes.filter((dish) => Boolean(dish?.imageUrl)).length;
  }

  return { total, completed };
};

export const menuHasMissingImages = (menu) => {
  const { total, completed } = getImageProgress(menu);
  return total > completed;
};

const generateImageDataUrl = async ({
  dishName,
  ingredients,
  imageStyle = 'detailed',
  type = 'dish',
}) => {
  if (!dishName) {
    throw new Error('Dish name is required');
  }

  const apiKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NANOBANANA_API_KEY or GEMINI_API_KEY not configured');
  }

  const model = process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';
  const styleDesc = styleDescriptions[imageStyle] || styleDescriptions.simple;
  const ingredientsText = ingredients ? `; key ingredients: ${ingredients}` : '';
  const sharedScene =
    'same rustic wooden restaurant table with consistent wood grain; centered composition; wide landscape framing; fully visible main subject; no cropping; shallow depth of field';
  const sharedConstraints =
    'no people, no hands; no text, no watermark; not studio-lit; not advertisement; not perfect styling; avoid hyperreal, HDR';
  const subjectBlock =
    type === 'drink'
      ? 'single drink only; one glass or cup centered; fully visible glass; no food; no extra glasses; minimal props'
      : 'single dish only; one plate or bowl centered; fully visible plate; no other food; no drinks; no extra plates; minimal props';

  const imagePrompt =
    `${dishName}${ingredientsText}; ${styleDesc}; ${sharedScene}; ${subjectBlock}; ${sharedConstraints}`;

  const ai = new GoogleGenAI({ apiKey });
  const maxAttempts = 2;
  const baseDelayMs = 600;
  const jitterMs = 600;

  const generateOnce = async () => {
    const response = await ai.models.generateContent({
      model,
      contents: imagePrompt,
      config: {
        responseModalities: ['Image'],
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    let imageBuffer = null;
    let mimeType = 'image/png';
    if (response.candidates?.[0]?.content) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          mimeType = part.inlineData.mimeType || mimeType;
          imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          break;
        }
      }
    }

    if (!imageBuffer) {
      throw new Error('No image data in API response');
    }

    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  };

  let imageDataUrl = null;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      imageDataUrl = await generateOnce();
      break;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs + Math.floor(Math.random() * jitterMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (!imageDataUrl) {
    throw lastError || new Error('Image generation failed');
  }

  return imageDataUrl;
};

export const generateMissingImagesForMenu = async (menuId, imageStyle = 'detailed') => {
  const menuRecord = await getMenuRecord(menuId);
  if (!menuRecord?.menu) return null;

  const initialProgress = getImageProgress(menuRecord.menu);
  if (initialProgress.total === 0) {
    return updateMenuRecordInternal(menuId, {
      imageGenerationStatus: 'complete',
      imageGenerationTotal: 0,
      imageGenerationCompleted: 0,
      imageGenerationCompletedAt: new Date().toISOString(),
    });
  }

  if (!menuHasMissingImages(menuRecord.menu)) {
    return updateMenuRecordInternal(menuId, {
      imageGenerationStatus: 'complete',
      imageGenerationTotal: initialProgress.total,
      imageGenerationCompleted: initialProgress.completed,
      imageGenerationCompletedAt: new Date().toISOString(),
    });
  }

  if (menuRecord.imageGenerationStatus === 'in_progress') {
    return menuRecord.menu;
  }

  let workingMenu = structuredClone(menuRecord.menu);
  const startedAt = new Date().toISOString();
  let writeQueue = Promise.resolve();

  const queueProgressUpdate = (statusOverride) => {
    const snapshot = structuredClone(workingMenu);
    const progress = getImageProgress(snapshot);

    writeQueue = writeQueue.then(() =>
      updateMenuRecordInternal(menuId, {
        menu: snapshot,
        imageGenerationStatus:
          statusOverride ||
          (progress.completed >= progress.total ? 'complete' : 'in_progress'),
        imageGenerationTotal: progress.total,
        imageGenerationCompleted: progress.completed,
        imageGenerationStartedAt: menuRecord.imageGenerationStartedAt || startedAt,
        imageGenerationCompletedAt:
          progress.completed >= progress.total ? new Date().toISOString() : null,
      })
    );

    return writeQueue;
  };

  await updateMenuRecordInternal(menuId, {
    imageGenerationStatus: 'in_progress',
    imageGenerationTotal: initialProgress.total,
    imageGenerationCompleted: initialProgress.completed,
    imageGenerationStartedAt: menuRecord.imageGenerationStartedAt || startedAt,
    imageGenerationCompletedAt: null,
  });

  const missingDishes = [];

  for (const [sectionName, dishes] of Object.entries(workingMenu)) {
    if (!Array.isArray(dishes)) continue;

    for (let index = 0; index < dishes.length; index += 1) {
      const dish = dishes[index];
      if (!dish?.imageUrl) {
        missingDishes.push({ sectionName, index, dish });
      }
    }
  }

  await Promise.allSettled(
    missingDishes.map(async ({ sectionName, index, dish }) => {
      try {
        const imageUrl = await generateImageDataUrl({
          dishName: dish.name,
          ingredients: dish.ingredients,
          imageStyle,
          type: sectionName.toLowerCase().includes('drink') ? 'drink' : 'dish',
        });

        workingMenu[sectionName][index] = {
          ...workingMenu[sectionName][index],
          imageUrl,
        };

        await queueProgressUpdate();
      } catch (error) {
        console.error(`Failed to generate image for ${dish?.name || 'dish'}:`, error);
      }
    })
  );

  const finalProgress = getImageProgress(workingMenu);

  await queueProgressUpdate(
    finalProgress.completed >= finalProgress.total ? 'complete' : 'partial'
  );
  await writeQueue;

  return workingMenu;
};

export { generateImageDataUrl };
