import axios from "axios";

// В CRA переменные окружения должны начинаться с REACT_APP_
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  // Не падаем, но даем подсказку в консоли
  // eslint-disable-next-line no-console
  console.warn(
    "REACT_APP_API_URL не задан. Установите его в .env, чтобы фронтенд мог обращаться к Apps Script."
  );
}

const cache = new Map();

function makeKey(params) {
  return JSON.stringify(params);
}

/**
 * Запрос лидов и агрегаций с backend (Apps Script).
 * Оборачиваем параметры в объект params, чтобы axios сформировал query string.
 * Результаты кешируются в памяти до перезагрузки страницы.
 */
export async function fetchLeads({
  limit = 10,
  offset = 0,
  quality = "all",
  search = "",
  from,
  to,
  model = "all",
  source = "all",
  status = "all",
  tags = ""
} = {}) {
  if (!API_URL) {
    throw new Error("REACT_APP_API_URL is not configured");
  }

  const params = {
    limit,
    offset,
    quality,
    search,
    model,
    source,
    status,
    tags
  };

  if (from) {
    params.from = from;
  }
  if (to) {
    params.to = to;
  }

  const key = makeKey(params);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const response = await axios.get(API_URL, { params });
  cache.set(key, response.data);
  return response.data;
}

/**
 * Обновление статуса лида.
 */
export async function updateLeadStatus(id, leadStatus) {
  if (!API_URL) {
    throw new Error("REACT_APP_API_URL is not configured");
  }

  const response = await axios.post(API_URL, {
    action: "update_status",
    id,
    lead_status: leadStatus
  });

  // после изменения данных можно очистить кеш
  cache.clear();
  return response.data;
}

/**
 * Обновление тегов лида.
 */
export async function updateLeadTags(id, tags) {
  if (!API_URL) {
    throw new Error("REACT_APP_API_URL is not configured");
  }

  const response = await axios.post(API_URL, {
    action: "update_tags",
    id,
    tags
  });

  cache.clear();
  return response.data;
}

