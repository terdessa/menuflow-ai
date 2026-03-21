// Client-side storage utilities

export const STORAGE_KEYS = {
  PREFERENCES: 'menuflow_preferences',
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

const jsonRequest = async (input, init) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
};

export const getSavedMenus = async () => {
  const data = await jsonRequest('/api/menus', {
    method: 'GET',
    cache: 'no-store',
  });
  return data.menus || [];
};

export const saveMenu = async (menu) => {
  const data = await jsonRequest('/api/menus', {
    method: 'POST',
    body: JSON.stringify(menu),
  });
  return data.menu || null;
};

export const getMenuById = async (id) => {
  const data = await jsonRequest(`/api/menus/${id}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return data.menu || null;
};

export const deleteMenuById = async (id) => {
  const data = await jsonRequest(`/api/menus/${id}`, {
    method: 'DELETE',
  });
  return data.menu || null;
};

export const updateSavedMenu = async (id, updatedMenuData) => {
  const data = await jsonRequest(`/api/menus/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ menu: updatedMenuData }),
  });
  return data.menu || null;
};

export const clearSavedMenus = async () => {
  const data = await jsonRequest('/api/menus', {
    method: 'DELETE',
  });
  return data.deletedMenus || [];
};
