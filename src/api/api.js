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

function normalizeDateToDDMM(value) {
  if (!value) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const directMatch = raw.match(/^(\d{2})\.(\d{2})/);
  if (directMatch) {
    return `${directMatch[1]}.${directMatch[2]}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}`;
  }

  return raw;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeBucket(bucket) {
  const normalized = String(bucket || "").trim().toLowerCase();

  if (["высокий", "хороший", "high", "good", "top"].includes(normalized)) {
    return "high";
  }
  if (["средний", "medium", "avg", "average"].includes(normalized)) {
    return "medium";
  }
  if (["низкий", "low"].includes(normalized)) {
    return "low";
  }

  return null;
}

function sortByDateLabel(a, b) {
  const [aDay = "0", aMonth = "0"] = String(a.date || "").split(".");
  const [bDay = "0", bMonth = "0"] = String(b.date || "").split(".");
  const aNum = Number(aMonth) * 100 + Number(aDay);
  const bNum = Number(bMonth) * 100 + Number(bDay);

  return aNum - bNum;
}

/**
 * Преобразует ответ backend в формат для stacked bar chart:
 * [{ date: "DD.MM", high, medium, low, total }]
 */
export function transformLeadsQualityDynamics(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const normalized = rawData
    .map((item) => {
      const date = normalizeDateToDDMM(item?.date || item?.day || item?.datetime || item?.created_at);
      if (!date) return null;

      const high = toNumber(item?.high ?? item?.high_count ?? item?.highQuality ?? item?.high_quality);
      const medium = toNumber(item?.medium ?? item?.medium_count ?? item?.mediumQuality ?? item?.medium_quality);
      const low = toNumber(item?.low ?? item?.low_count ?? item?.lowQuality ?? item?.low_quality);

      const total = toNumber(item?.total ?? item?.count_total ?? item?.leads_total) || (high + medium + low);

      return {
        date,
        high,
        medium,
        low,
        total,
      };
    })
    .filter(Boolean)
    .sort(sortByDateLabel);

  return normalized;
}

function buildDynamicsFromLeads(leads) {
  if (!Array.isArray(leads) || leads.length === 0) return [];

  const grouped = leads.reduce((acc, lead) => {
    const date = normalizeDateToDDMM(lead?.datetime || lead?.created_at || lead?.date);
    if (!date) return acc;

    const bucket = normalizeBucket(lead?.client_quality_bucket || lead?.quality || lead?.quality_bucket);
    if (!bucket) return acc;

    if (!acc.has(date)) {
      acc.set(date, { date, high: 0, medium: 0, low: 0, total: 0 });
    }

    const dayItem = acc.get(date);
    dayItem[bucket] += 1;
    dayItem.total += 1;

    return acc;
  }, new Map());

  return Array.from(grouped.values()).sort(sortByDateLabel);
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
  startDate,
  endDate,
  from,
  to,
  model = "all",
  source = "all"
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
    source
  };

  const resolvedStartDate = startDate || (from ? String(from).slice(0, 10) : "");
  const resolvedEndDate = endDate || (to ? String(to).slice(0, 10) : "");
  const resolvedFrom = from || (startDate ? `${startDate}T00:00:00` : "");
  const resolvedTo = to || (endDate ? `${endDate}T23:59:59` : "");

  if (resolvedStartDate) {
    params.startDate = resolvedStartDate;
  }
  if (resolvedEndDate) {
    params.endDate = resolvedEndDate;
  }
  if (resolvedFrom) {
    params.from = resolvedFrom;
  }
  if (resolvedTo) {
    params.to = resolvedTo;
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
 * Получение динамики качества лидов по дням.
 * При отсутствии выделенного backend-endpoint выполняется безопасный fallback на агрегацию из списка лидов.
 */
export async function getLeadsQualityDynamics({
  startDate,
  endDate,
  from,
  to,
  fallbackLeads = [],
  dashboardData = null,
} = {}) {
  if (!API_URL) {
    throw new Error("REACT_APP_API_URL is not configured");
  }

  const fromDate = startDate || (from ? String(from).slice(0, 10) : "");
  const toDate = endDate || (to ? String(to).slice(0, 10) : "");

  const fromDateTime = from || (startDate ? `${startDate}T00:00:00` : "");
  const toDateTime = to || (endDate ? `${endDate}T23:59:59` : "");

  const inlineDynamics =
    dashboardData?.aggregations?.leads_quality_dynamics ||
    dashboardData?.aggregations?.quality_dynamics ||
    dashboardData?.leads_quality_dynamics ||
    dashboardData?.quality_dynamics;

  if (Array.isArray(inlineDynamics) && inlineDynamics.length > 0) {
    return transformLeadsQualityDynamics(inlineDynamics);
  }

  const params = {
    action: "leads_quality_dynamics",
  };

  if (fromDate) params.startDate = fromDate;
  if (toDate) params.endDate = toDate;
  if (fromDateTime) params.from = fromDateTime;
  if (toDateTime) params.to = toDateTime;

  try {
    const response = await axios.get(API_URL, { params });
    const payload = response?.data;
    const responseDynamics =
      payload?.data ||
      payload?.leads_quality_dynamics ||
      payload?.quality_dynamics ||
      payload;

    const transformed = transformLeadsQualityDynamics(responseDynamics);
    if (transformed.length > 0) {
      return transformed;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Не удалось получить leads_quality_dynamics, используем fallback из списка лидов.", error);
  }

  return buildDynamicsFromLeads(fallbackLeads);
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

