import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'menuflow_session_id';

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const redisRequest = async (command) => {
  const url = getRequiredEnv('UPSTASH_REDIS_REST_URL');
  const token = getRequiredEnv('UPSTASH_REDIS_REST_TOKEN');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(data?.error || 'Redis request failed');
  }

  return data.result;
};

const menuKey = (id) => `menu:${id}`;
const ownerIndexKey = (sessionId) => `menus:owner:${sessionId}`;
const imageMetaKey = (id) => `menu-image:${id}:meta`;
const imageChunkKey = (id, index) => `menu-image:${id}:chunk:${index}`;
const IMAGE_CHUNK_SIZE = 3_000_000;

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const createSessionId = () => crypto.randomUUID();

export const getSessionIdFromRequest = (request) =>
  request.cookies.get(SESSION_COOKIE_NAME)?.value || null;

export const attachSessionCookie = (response, sessionId) => {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
};

const sanitizeMenuRecord = (menu) => {
  if (!menu) return null;

  const publicMenu = { ...menu };
  delete publicMenu.ownerSessionId;
  return publicMenu;
};

const countDishes = (menu) =>
  Object.values(menu || {}).reduce((total, dishes) => {
    if (!Array.isArray(dishes)) return total;
    return total + dishes.length;
  }, 0);

const getOwnerIndex = async (sessionId) => {
  const value = await redisRequest(['GET', ownerIndexKey(sessionId)]);
  return parseJson(value, []);
};

const setOwnerIndex = async (sessionId, ids) => {
  await redisRequest(['SET', ownerIndexKey(sessionId), JSON.stringify(ids)]);
};

const parseDataUrl = (dataUrl) => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Invalid image data URL');
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
};

export const getMenuRecord = async (id) => {
  const value = await redisRequest(['GET', menuKey(id)]);
  return parseJson(value, null);
};

export const getPublicMenu = async (id) => sanitizeMenuRecord(await getMenuRecord(id));

export const storeMenuImage = async (dataUrl) => {
  const { mimeType, base64Data } = parseDataUrl(dataUrl);
  const imageId = crypto.randomUUID();
  const chunks = [];

  for (let index = 0; index < base64Data.length; index += IMAGE_CHUNK_SIZE) {
    chunks.push(base64Data.slice(index, index + IMAGE_CHUNK_SIZE));
  }

  await redisRequest([
    'SET',
    imageMetaKey(imageId),
    JSON.stringify({
      mimeType,
      chunkCount: chunks.length,
      createdAt: new Date().toISOString(),
    }),
  ]);

  await Promise.all(
    chunks.map((chunk, index) =>
      redisRequest(['SET', imageChunkKey(imageId, index), chunk])
    )
  );

  return `/api/menu-images/${imageId}`;
};

export const getMenuImage = async (imageId) => {
  const metadata = parseJson(await redisRequest(['GET', imageMetaKey(imageId)]), null);
  if (!metadata?.mimeType || !metadata?.chunkCount) {
    return null;
  }

  const chunks = await Promise.all(
    Array.from({ length: metadata.chunkCount }, (_, index) =>
      redisRequest(['GET', imageChunkKey(imageId, index)])
    )
  );

  if (chunks.some((chunk) => typeof chunk !== 'string')) {
    return null;
  }

  return {
    mimeType: metadata.mimeType,
    buffer: Buffer.from(chunks.join(''), 'base64'),
  };
};

export const listMenusForOwner = async (sessionId) => {
  const ids = await getOwnerIndex(sessionId);
  const menus = await Promise.all(ids.map((id) => getMenuRecord(id)));
  return menus
    .filter(Boolean)
    .map(sanitizeMenuRecord)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const createMenuForOwner = async (sessionId, menuInput) => {
  const id = menuInput.id || crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const imageGenerationTotal = countDishes(menuInput.menu || {});
  const menuRecord = {
    id,
    ownerSessionId: sessionId,
    restaurantName: menuInput.restaurantName || 'Uploaded Menu',
    location: menuInput.location || 'Unknown',
    language: menuInput.language || 'English',
    menu: menuInput.menu || {},
    createdAt: timestamp,
    updatedAt: timestamp,
    publicUrl: `/menu/${id}`,
    imageGenerationStatus: imageGenerationTotal > 0 ? 'pending' : 'complete',
    imageGenerationTotal,
    imageGenerationCompleted: 0,
    imageGenerationStartedAt: null,
    imageGenerationCompletedAt: imageGenerationTotal > 0 ? null : timestamp,
  };

  await redisRequest(['SET', menuKey(id), JSON.stringify(menuRecord)]);

  const ownerIndex = await getOwnerIndex(sessionId);
  if (!ownerIndex.includes(id)) {
    ownerIndex.unshift(id);
    await setOwnerIndex(sessionId, ownerIndex);
  }

  return sanitizeMenuRecord(menuRecord);
};

export const updateMenuForOwner = async (id, sessionId, updates) => {
  const existing = await getMenuRecord(id);
  if (!existing) return null;
  if (existing.ownerSessionId !== sessionId) {
    throw new Error('Forbidden');
  }

  const updatedRecord = {
    ...existing,
    ...updates,
    id: existing.id,
    ownerSessionId: existing.ownerSessionId,
    publicUrl: existing.publicUrl,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await redisRequest(['SET', menuKey(id), JSON.stringify(updatedRecord)]);
  return sanitizeMenuRecord(updatedRecord);
};

export const updateMenuRecordInternal = async (id, updates) => {
  const existing = await getMenuRecord(id);
  if (!existing) return null;

  const updatedRecord = {
    ...existing,
    ...updates,
    id: existing.id,
    ownerSessionId: existing.ownerSessionId,
    publicUrl: existing.publicUrl,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await redisRequest(['SET', menuKey(id), JSON.stringify(updatedRecord)]);
  return sanitizeMenuRecord(updatedRecord);
};

export const deleteMenuForOwner = async (id, sessionId) => {
  const existing = await getMenuRecord(id);
  if (!existing) return null;
  if (existing.ownerSessionId !== sessionId) {
    throw new Error('Forbidden');
  }

  await redisRequest(['DEL', menuKey(id)]);

  const ownerIndex = await getOwnerIndex(sessionId);
  await setOwnerIndex(
    sessionId,
    ownerIndex.filter((menuId) => menuId !== id)
  );

  return sanitizeMenuRecord(existing);
};

export const clearMenusForOwner = async (sessionId) => {
  const ids = await getOwnerIndex(sessionId);
  const menus = await Promise.all(ids.map((id) => getMenuRecord(id)));

  if (ids.length > 0) {
    await Promise.all(ids.map((id) => redisRequest(['DEL', menuKey(id)])));
  }

  await redisRequest(['DEL', ownerIndexKey(sessionId)]);

  return menus.filter(Boolean).map(sanitizeMenuRecord);
};
