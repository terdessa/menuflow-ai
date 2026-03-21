import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadServerEnv } from '@/lib/serverEnv';

export const runtime = 'nodejs';
loadServerEnv();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableModelError = (error) => {
  const status = error?.status;
  return status === 429 || status === 500 || status === 503 || status === 504;
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS ||
      'gemini-2.5-flash,gemini-1.5-pro')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item);
    const modelCandidates = [...new Set([primaryModel, ...fallbackModels])];

    // Convert files to base64
    const imageParts = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        return {
          inlineData: {
            data: base64,
            mimeType: file.type || 'image/jpeg',
          },
        };
      })
    );

    // Create a detailed prompt for structured JSON output with translation
    const targetLanguage = 'English';
    const prompt = `Analyze the menu images provided and extract all menu items. Translate every extracted item name and ingredients into ${targetLanguage} while keeping meanings accurate. Return a strictly formatted JSON object with the following structure:

{
  "sections": {
    "Soups": [
      {
        "name": "Item name",
        "ingredients": "List of ingredients",
        "price": 12.99,
        "icons": ["allergen-warning", "recommended"],
        "nutritionPer100g": {
          "calories": 120,
          "protein": 6.5,
          "carbs": 14.2,
          "fat": 4.8
        },
        "filterProperties": {
          "allergies": [],
          "spiceLevel": "mild",
          "alcoholType": null,
          "cookingStyle": "steamed",
          "tasteProfile": ["savoury"],
          "texture": "smooth",
          "meatType": null
        }
      }
    ],
    "Salads": [],
    "Starters": [],
    "Main dishes": [],
    "Desserts": [],
    "Drinks": []
  }
}

IMPORTANT RULES:
1. Use ONLY these section names: "Soups", "Salads", "Starters", "Main dishes", "Desserts", "Drinks"
2. For each item, include ALL available information from the menu
3. For filterProperties:
   - allergies: array of allergens present: ["nuts", "gluten", "dairy", "eggs", "seafood", "soy", "shellfish", "sesame", "sulfites", "mustard", "celery", "lupin", "molluscs"]
   - spiceLevel: one of "none", "mild", "medium", "hot", "very-hot"
   - alcoholType: one of ["wine", "beer", "cocktail", "prosecco", "spirits", "champagne", "sake", "cider"] or null
   - cookingStyle: one of ["grilled", "fried", "baked", "raw", "steamed", "roasted", "boiled", "sauteed", "braised", "smoked"] or null
   - tasteProfile: array from: ["sweet", "savoury", "salty", "sour", "bitter", "umami", "spicy", "tangy"]
   - texture: one of ["crispy", "soft", "creamy", "crunchy", "tender", "smooth", "chewy", "flaky"] or null
   - meatType: one of ["chicken", "beef", "pork", "lamb", "turkey", "duck", "seafood", "fish"] or null
4. Add "allergen-warning" to icons only when the dish contains one or more allergens
4. For nutritionPer100g:
   - estimate approximate nutrition per 100 grams for the prepared dish
   - calories must be a number in kcal
   - protein, carbs, and fat must be numbers in grams
   - ALWAYS include all four keys: calories, protein, carbs, fat
   - use your best reasonable estimate from the dish name, ingredients, and typical preparation style
   - return numbers only, with no units in the JSON
5. Add "recommended" to icons array for popular or chef's special items
6. Extract prices accurately - use numbers only (no currency symbols)
7. Translate names and ingredients into ${targetLanguage}; if text is already in ${targetLanguage}, keep it as is
8. Return ONLY valid JSON, no markdown, no code blocks, no explanations
9. If a section has no items, use an empty array
10. For every item in "Soups", "Salads", "Starters", and "Main dishes", always assign a spiceLevel and always assign an allergies array, even when the best value is "none" or an empty array
11. For "Desserts" and "Drinks", do not infer or assign spiceLevel tags; use null for spiceLevel unless the menu explicitly describes spice
12. For "Desserts" and "Drinks", leave allergies as an empty array unless the menu explicitly states allergens
13. When inferring allergies for non-drink, non-dessert dishes, be conservative and comprehensive: consider common preparation variations, sauces, coatings, broths, marinades, garnishes, fryer cross-use, hidden binders, dairy or egg enrichment, soy-based seasonings, gluten in breading or sauces, nuts or sesame in pesto or toppings, shellfish/seafood stock, sulfites in preserved ingredients, and mustard/celery in dressings or bases
14. If a non-drink, non-dessert dish could reasonably contain multiple allergens depending on how it is commonly prepared, include all plausible allergens in the allergies array
15. Analyze ingredients carefully to determine filter properties and nutrition estimates

Return the JSON now:`;

    // Call Gemini API with retry/backoff and model fallback for transient overloads.
    let text = '';
    let model = primaryModel;
    let lastModelError = null;

    for (const candidateModel of modelCandidates) {
      const geminiModel = genAI.getGenerativeModel({ model: candidateModel });

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const result = await geminiModel.generateContent([prompt, ...imageParts]);
          const response = await result.response;
          text = response.text();
          model = candidateModel;
          lastModelError = null;
          break;
        } catch (error) {
          lastModelError = error;
          console.error(
            `Menu extraction failed for model ${candidateModel} (attempt ${attempt}/3):`,
            error
          );

          if (!isRetryableModelError(error)) {
            break;
          }

          if (attempt < 3) {
            await sleep(600 * attempt);
          }
        }
      }

      if (text) {
        break;
      }
    }

    if (!text) {
      throw lastModelError || new Error('Menu extraction failed');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const firstBraceIndex = jsonText.indexOf('{');
    const lastBraceIndex = jsonText.lastIndexOf('}');
    if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
      jsonText = jsonText.slice(firstBraceIndex, lastBraceIndex + 1);
    }

    // Parse JSON
    let menuData;
    try {
      menuData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(
        { error: 'Failed to parse menu data from AI response', details: parseError.message },
        { status: 500 }
      );
    }

    // Validate and normalize the structure
    const normalizedMenu = {
      Soups: menuData.sections?.Soups || menuData.Soups || [],
      Salads: menuData.sections?.Salads || menuData.Salads || [],
      Starters: menuData.sections?.Starters || menuData.Starters || [],
      'Main dishes': menuData.sections?.['Main dishes'] || menuData['Main dishes'] || [],
      Desserts: menuData.sections?.Desserts || menuData.Desserts || [],
      Drinks: menuData.sections?.Drinks || menuData.Drinks || [],
    };

    // Helper function to deduplicate array while preserving order
    const deduplicateArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      const seen = new Set();
      return arr.filter((item) => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      });
    };

    const normalizeSpiceLevel = (section, spiceLevel) => {
      const isExcludedSection =
        section === 'Desserts' || section === 'Drinks';

      if (isExcludedSection) {
        return spiceLevel ?? null;
      }

      const allowedSpiceLevels = ['none', 'mild', 'medium', 'hot', 'very-hot'];
      return allowedSpiceLevels.includes(spiceLevel) ? spiceLevel : 'none';
    };

    const normalizeAllergies = (section, allergies) => {
      const isExcludedSection =
        section === 'Desserts' || section === 'Drinks';

      if (isExcludedSection) {
        return deduplicateArray(Array.isArray(allergies) ? allergies : []);
      }

      return deduplicateArray(Array.isArray(allergies) ? allergies : []);
    };

    const normalizeNumericValue = (value) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    // Normalize each menu item to ensure consistent structure
    Object.keys(normalizedMenu).forEach((section) => {
      normalizedMenu[section] = normalizedMenu[section].map((item) => {
        const filterProperties = item.filterProperties || {};
        const normalizedAllergies = normalizeAllergies(
          section,
          filterProperties.allergies
        );
        const normalizedIcons = deduplicateArray([
          ...(Array.isArray(item.icons) ? item.icons : []),
          ...(normalizedAllergies.length > 0 ? ['allergen-warning'] : []),
        ]);

        return {
          name: item.name || 'Unnamed Item',
          ingredients: item.ingredients || '',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          icons: normalizedIcons,
          nutritionPer100g: {
            calories: normalizeNumericValue(item.nutritionPer100g?.calories),
            protein: normalizeNumericValue(item.nutritionPer100g?.protein),
            carbs: normalizeNumericValue(item.nutritionPer100g?.carbs),
            fat: normalizeNumericValue(item.nutritionPer100g?.fat),
          },
          filterProperties: {
            ...filterProperties,
            allergies: normalizedAllergies,
            spiceLevel: normalizeSpiceLevel(section, filterProperties.spiceLevel),
          },
          imageUrl: item.imageUrl || null,
        };
      });
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extractionFilename = `menu-extraction-${timestamp}.json`;
    let extractionPath = null;

    try {
      const extractionDir = path.join('/tmp', 'menu-extractions');
      fs.mkdirSync(extractionDir, { recursive: true });
      extractionPath = path.join(extractionDir, extractionFilename);

      fs.writeFileSync(
        extractionPath,
        JSON.stringify(
          {
            savedAt: new Date().toISOString(),
            sourceImageCount: files.length,
            model,
            targetLanguage,
            rawResponse: menuData,
            normalizedMenu,
          },
          null,
          2
        )
      );
    } catch (writeError) {
      console.warn('Skipping local extraction dump:', writeError);
    }

    return NextResponse.json({
      menu: normalizedMenu,
      savedJsonPath: extractionPath,
      savedJsonFilename: extractionFilename,
    });
  } catch (error) {
    console.error('Error processing menu:', error);
    return NextResponse.json(
      { error: 'Failed to process menu', details: error.message },
      { status: 500 }
    );
  }
}
