// Constants for the application

export const DIET_TYPES = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'sugar-free', label: 'Sugar-free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'low-carb', label: 'Low-carb' },
];

export const ALLERGIES = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'soy', label: 'Soy' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'sulfites', label: 'Sulfites' },
  { value: 'mustard', label: 'Mustard' },
  { value: 'celery', label: 'Celery' },
  { value: 'lupin', label: 'Lupin' },
  { value: 'molluscs', label: 'Molluscs' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { value: 'CHF', label: 'CHF', symbol: 'CHF' },
  { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
];

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
];

export const SPICE_TOLERANCE = [
  { value: 'none', label: 'No spice', emoji: '🟢', color: 'bg-green-500' },
  { value: 'mild', label: 'Mild', emoji: '🟡', color: 'bg-yellow-500' },
  { value: 'medium', label: 'Medium', emoji: '🟠', color: 'bg-orange-500' },
  { value: 'hot', label: 'Hot', emoji: '🔴', color: 'bg-red-500' },
  { value: 'very-hot', label: 'Very Hot', emoji: '🌶️', color: 'bg-red-600' },
];

export const ALCOHOL_TYPES = [
  { value: 'wine', label: 'Wine', emoji: '🍷' },
  { value: 'beer', label: 'Beer', emoji: '🍺' },
  { value: 'cocktail', label: 'Cocktail', emoji: '🍸' },
  { value: 'prosecco', label: 'Prosecco', emoji: '🥂' },
  { value: 'spirits', label: 'Spirits', emoji: '🥃' },
  { value: 'champagne', label: 'Champagne', emoji: '🍾' },
  { value: 'sake', label: 'Sake', emoji: '🍶' },
  { value: 'cider', label: 'Cider', emoji: '🍻' },
];

export const IMAGE_STYLES = [
  { value: 'minimalistic', label: 'Minimalistic Icon/Vector', emoji: '🎨' },
  { value: 'simple', label: 'Simple Photo', emoji: '📷' },
  { value: 'detailed', label: 'Highly Detailed Dish', emoji: '✨' },
];

export const DISH_CATEGORIES = [
  { value: 'starters', label: 'Starters', emoji: '🥗' },
  { value: 'mains', label: 'Main Dishes', emoji: '🍽️' },
  { value: 'desserts', label: 'Desserts', emoji: '🍰' },
  { value: 'drinks', label: 'Drinks', emoji: '🥤' },
  { value: 'soups', label: 'Soups', emoji: '🍲' },
  { value: 'salads', label: 'Salads', emoji: '🥙' },
];

export const SPEED_PREFERENCES = [
  { value: 'quick', label: 'Quick Meals', emoji: '⚡', description: 'Fast service preferred' },
  { value: 'normal', label: 'Normal', emoji: '⏱️', description: 'Standard waiting time' },
  { value: 'long-okay', label: 'Long Waiting Okay', emoji: '🍽️', description: 'Fine dining, no rush' },
];

export const TEXTURE_PREFERENCES = [
  { value: 'crispy', label: 'Crispy', emoji: '🍗' },
  { value: 'soft', label: 'Soft', emoji: '🍞' },
  { value: 'creamy', label: 'Creamy', emoji: '🥛' },
  { value: 'crunchy', label: 'Crunchy', emoji: '🥜' },
  { value: 'tender', label: 'Tender', emoji: '🥩' },
  { value: 'smooth', label: 'Smooth', emoji: '🍨' },
  { value: 'chewy', label: 'Chewy', emoji: '🍪' },
  { value: 'flaky', label: 'Flaky', emoji: '🥐' },
];

export const COOKING_STYLES = [
  { value: 'grilled', label: 'Grilled', emoji: '🔥' },
  { value: 'fried', label: 'Fried', emoji: '🍳' },
  { value: 'baked', label: 'Baked', emoji: '🥖' },
  { value: 'raw', label: 'Raw', emoji: '🐟' },
  { value: 'steamed', label: 'Steamed', emoji: '💨' },
  { value: 'roasted', label: 'Roasted', emoji: '🍖' },
  { value: 'boiled', label: 'Boiled', emoji: '🍲' },
  { value: 'sauteed', label: 'Sautéed', emoji: '🍴' },
  { value: 'braised', label: 'Braised', emoji: '🍖' },
  { value: 'smoked', label: 'Smoked', emoji: '💨' },
];

export const PORTION_SHARING = [
  { value: 'alone', label: 'Eating Alone', emoji: '👤' },
  { value: '2', label: '2 People', emoji: '👥' },
  { value: '3', label: '3 People', emoji: '👥' },
  { value: '4', label: '4 People', emoji: '👥' },
  { value: '5', label: '5 People', emoji: '👥' },
  { value: '6+', label: '6+ People', emoji: '👥' },
];

export const TASTE_PREFERENCES = [
  { value: 'sweet', label: 'Sweet', emoji: '🍬' },
  { value: 'savoury', label: 'Savoury', emoji: '🧂' },
  { value: 'salty', label: 'Salty', emoji: '🥨' },
  { value: 'sour', label: 'Sour', emoji: '🍋' },
  { value: 'bitter', label: 'Bitter', emoji: '☕' },
  { value: 'umami', label: 'Umami', emoji: '🍄' },
  { value: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { value: 'tangy', label: 'Tangy', emoji: '🍊' },
];

export const MEAT_PREFERENCES = [
  { value: 'chicken', label: 'Chicken', emoji: '🍗' },
  { value: 'beef', label: 'Beef', emoji: '🥩' },
  { value: 'pork', label: 'Pork', emoji: '🥓' },
  { value: 'lamb', label: 'Lamb', emoji: '🐑' },
  { value: 'turkey', label: 'Turkey', emoji: '🦃' },
  { value: 'duck', label: 'Duck', emoji: '🦆' },
  { value: 'seafood', label: 'Seafood', emoji: '🦞' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
];

export const MENU_SECTIONS = [
  'Soups',
  'Salads',
  'Starters',
  'Main dishes',
  'Desserts',
  'Drinks',
];

export const ICON_TYPES = {
  VEGAN: 'vegan',
  VEGETARIAN: 'vegetarian',
  PESCATARIAN: 'pescatarian',
  HALAL: 'halal',
  GLUTEN_FREE: 'gluten-free',
  SUGAR_FREE: 'sugar-free',
  ALLERGEN_WARNING: 'allergen-warning',
  RECOMMENDED: 'recommended',
};

