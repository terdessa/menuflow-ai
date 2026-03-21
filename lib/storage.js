// Client-side storage utilities
// Preferences → localStorage (user-local, no DB)
// Menus → async API calls to /api/menus (Neon Postgres)

export const STORAGE_KEYS = {
  PREFERENCES: 'menuflow_preferences',
};

// ─── Preferences (localStorage, unchanged) ───────────────────────

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

// ─── Menus (async API calls to Neon Postgres) ────────────────────

export const getSavedMenus = async () => {
  try {
    const res = await fetch('/api/menus');
    if (!res.ok) throw new Error('Failed to fetch menus');
    return await res.json();
  } catch (error) {
    console.error('getSavedMenus error:', error);
    return [];
  }
};

export const saveMenu = async (menu) => {
  try {
    const res = await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menu),
    });
    if (!res.ok) throw new Error('Failed to save menu');
    return await res.json();
  } catch (error) {
    console.error('saveMenu error:', error);
    return { ...menu, id: crypto.randomUUID() };
  }
};

export const getMenuById = async (id) => {
  try {
    const res = await fetch(`/api/menus/${id}`);
    if (!res.ok) return undefined;
    return await res.json();
  } catch (error) {
    console.error('getMenuById error:', error);
    return undefined;
  }
};

export const deleteMenuById = async (id) => {
  try {
    const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('deleteMenuById error:', error);
    return null;
  }
};

export const updateSavedMenu = async (id, updatedMenuData) => {
  try {
    const res = await fetch(`/api/menus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu: updatedMenuData }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('updateSavedMenu error:', error);
    return null;
  }
};

export const clearSavedMenus = async () => {
  try {
    const menus = await getSavedMenus();
    await Promise.all(menus.map((m) => deleteMenuById(m.id)));
  } catch (error) {
    console.error('clearSavedMenus error:', error);
  }
};
