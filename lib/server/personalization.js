const SPICE_LEVELS = ['none', 'mild', 'medium', 'hot', 'very-hot'];

const VEGETARIAN_DISALLOWED = [
  'beef',
  'pork',
  'lamb',
  'chicken',
  'turkey',
  'duck',
  'bacon',
  'ham',
  'sausage',
  'fish',
  'seafood',
  'shellfish',
  'shrimp',
  'prawn',
  'anchovy',
  'tuna',
  'salmon',
];

const VEGAN_EXTRA_DISALLOWED = [
  'dairy',
  'milk',
  'butter',
  'cream',
  'cheese',
  'yogurt',
  'egg',
  'eggs',
  'honey',
];

const scoreDishForProfile = (dish, sectionName, profile) => {
  const filterProperties = dish.filterProperties || {};
  const ingredients = `${dish.ingredients || ''} ${dish.name || ''}`.toLowerCase();
  const dietPreference = profile?.diet_preference || 'omnivore';
  const allergies = Array.isArray(profile?.allergies) ? profile.allergies : [];
  const excludeIngredients = Array.isArray(profile?.exclude_ingredients)
    ? profile.exclude_ingredients
    : [];
  const spiceTolerance = profile?.spice_tolerance || 'medium';

  const reasons = [];
  let score = 100;
  let status = 'safe';

  if (allergies.length > 0 && Array.isArray(filterProperties.allergies)) {
    const matches = allergies.filter((item) => filterProperties.allergies.includes(item));
    if (matches.length > 0) {
      status = 'avoid';
      score -= 70;
      reasons.push(`Possible allergens: ${matches.join(', ')}`);
    }
  }

  if (excludeIngredients.length > 0) {
    const matches = excludeIngredients.filter((item) => ingredients.includes(item.toLowerCase()));
    if (matches.length > 0) {
      status = 'avoid';
      score -= 40;
      reasons.push(`Contains avoided ingredients: ${matches.join(', ')}`);
    }
  }

  if (
    spiceTolerance !== 'any' &&
    filterProperties.spiceLevel &&
    SPICE_LEVELS.includes(filterProperties.spiceLevel)
  ) {
    const userIndex = SPICE_LEVELS.indexOf(spiceTolerance);
    const dishIndex = SPICE_LEVELS.indexOf(filterProperties.spiceLevel);
    if (dishIndex > userIndex) {
      status = status === 'avoid' ? 'avoid' : 'caution';
      score -= (dishIndex - userIndex) * 10;
      reasons.push(`Spicier than your preference (${filterProperties.spiceLevel})`);
    }
  }

  const icons = Array.isArray(dish.icons) ? dish.icons : [];
  if (dietPreference === 'vegetarian' || dietPreference === 'vegan') {
    const disallowedTerms = [
      ...VEGETARIAN_DISALLOWED,
      ...(dietPreference === 'vegan' ? VEGAN_EXTRA_DISALLOWED : []),
    ];
    const matchedTerms = disallowedTerms.filter((term) => ingredients.includes(term));
    const hasIconSupport =
      (dietPreference === 'vegan' && icons.includes('vegan')) ||
      (dietPreference === 'vegetarian' && (icons.includes('vegetarian') || icons.includes('vegan')));

    if (!hasIconSupport && matchedTerms.length > 0) {
      status = 'avoid';
      score -= 50;
      reasons.push(
        dietPreference === 'vegan'
          ? 'Not clearly compatible with a vegan diet'
          : 'Not clearly compatible with a vegetarian diet'
      );
    }
  }

  if (status === 'safe' && icons.includes('recommended')) {
    score += 5;
  }

  if (sectionName === 'Drinks' || sectionName === 'Desserts') {
    score -= 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    reasons,
  };
};

export const personalizeMenu = (menu, profile) => {
  if (!profile) {
    return {
      menu,
      summary: null,
    };
  }

  let safeCount = 0;
  let cautionCount = 0;
  let avoidCount = 0;

  const personalizedMenu = Object.fromEntries(
    Object.entries(menu || {}).map(([sectionName, dishes]) => {
      const personalizedDishes = (Array.isArray(dishes) ? dishes : [])
        .map((dish) => {
          const personalization = scoreDishForProfile(dish, sectionName, profile);
          if (personalization.status === 'safe') safeCount += 1;
          if (personalization.status === 'caution') cautionCount += 1;
          if (personalization.status === 'avoid') avoidCount += 1;

          return {
            ...dish,
            personalization,
          };
        })
        .sort((left, right) => right.personalization.score - left.personalization.score);

      return [sectionName, personalizedDishes];
    })
  );

  return {
    menu: personalizedMenu,
    summary: {
      profileLabel: profile.display_name || profile.profile_token,
      safeCount,
      cautionCount,
      avoidCount,
    },
  };
};
