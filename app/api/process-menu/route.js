import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

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

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

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
5. Add "recommended" to icons array for popular or chef's special items
6. Extract prices accurately - use numbers only (no currency symbols)
7. Translate names and ingredients into ${targetLanguage}; if text is already in ${targetLanguage}, keep it as is
8. Return ONLY valid JSON, no markdown, no code blocks, no explanations
9. If a section has no items, use an empty array
10. Analyze ingredients carefully to determine filter properties

Return the JSON now:`;

    // Call Gemini API
    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
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

    // Normalize each menu item to ensure consistent structure
    Object.keys(normalizedMenu).forEach((section) => {
      normalizedMenu[section] = normalizedMenu[section].map((item) => ({
        name: item.name || 'Unnamed Item',
        ingredients: item.ingredients || '',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        icons: deduplicateArray(Array.isArray(item.icons) ? item.icons : []),
        filterProperties: item.filterProperties || {},
        imageUrl: item.imageUrl || null,
      }));
    });

    const extractionDir = path.join(process.cwd(), 'tmp', 'menu-extractions');
    fs.mkdirSync(extractionDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extractionFilename = `menu-extraction-${timestamp}.json`;
    const extractionPath = path.join(extractionDir, extractionFilename);

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
