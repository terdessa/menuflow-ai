// Client-side storage utilities

export const STORAGE_KEYS = {
  PREFERENCES: 'menuflow_preferences',
  SAVED_MENUS: 'menuflow_saved_menus',
};

export const getPreferences = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const savePreferences = (preferences) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
};

export const getSavedMenus = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.SAVED_MENUS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveMenu = (menu) => {
  if (typeof window === 'undefined') return;
  const menus = getSavedMenus();
  const newMenu = {
    ...menu,
    id: menu.id || crypto.randomUUID(),
  };
  menus.unshift(newMenu);
  localStorage.setItem(STORAGE_KEYS.SAVED_MENUS, JSON.stringify(menus));
  return newMenu;
};

export const getMenuById = (id) => {
  const menus = getSavedMenus();
  return menus.find((m) => m.id === id);
};

export const deleteMenuById = (id) => {
  if (typeof window === 'undefined') return null;
  const menus = getSavedMenus();
  const menuToDelete = menus.find((m) => m.id === id) || null;
  const remainingMenus = menus.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_MENUS, JSON.stringify(remainingMenus));
  return menuToDelete;
};

export const updateSavedMenu = (id, updatedMenuData) => {
  if (typeof window === 'undefined') return null;
  const menus = getSavedMenus();
  const index = menus.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const updated = { ...menus[index], menu: updatedMenuData };
  menus[index] = updated;
  localStorage.setItem(STORAGE_KEYS.SAVED_MENUS, JSON.stringify(menus));
  return updated;
};

export const clearSavedMenus = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SAVED_MENUS, JSON.stringify([]));
};
