const { HttpError } = require('../utils/http');

const VIA_CEP_BASE_URL = 'https://viacep.com.br/ws';
const NOMINATIM_SEARCH_URL = process.env.GEOCODING_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 10000;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

const cepCache = new Map();
const geocodingCache = new Map();
let geocodingQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeCep(value) {
  const digits = onlyDigits(value);

  if (!/^\d{8}$/.test(digits)) {
    throw new HttpError(400, 'Informe um CEP valido com 8 digitos.');
  }

  return digits;
}

function formatCep(value) {
  const digits = normalizeCep(value);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildAddressLine({ endereco, numero } = {}) {
  return [String(endereco || '').trim(), String(numero || '').trim()]
    .filter(Boolean)
    .join(', ');
}

function buildGeocodingCacheKey(location) {
  return [
    normalizeText(location.cep),
    normalizeText(location.endereco),
    normalizeText(location.numero),
    normalizeText(location.bairro),
    normalizeText(location.cidade),
    normalizeText(location.estado),
  ].join('|');
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new HttpError(504, 'A consulta de localizacao demorou demais. Tente novamente.');
    }

    throw new HttpError(502, 'Nao foi possivel consultar o servico de localizacao.');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function lookupCep(value) {
  const digits = normalizeCep(value);

  if (cepCache.has(digits)) {
    return cepCache.get(digits);
  }

  const data = await fetchJson(`${VIA_CEP_BASE_URL}/${digits}/json/`);

  if (data.erro) {
    throw new HttpError(404, 'CEP nao encontrado.');
  }

  const location = {
    cep: formatCep(data.cep || digits),
    endereco: String(data.logradouro || '').trim(),
    bairro: String(data.bairro || '').trim(),
    cidade: String(data.localidade || '').trim(),
    estado: String(data.uf || '').trim().toUpperCase(),
  };

  cepCache.set(digits, location);
  return location;
}

function enqueueNominatimRequest(task) {
  const queuedRequest = geocodingQueue.then(async () => {
    const waitMs = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimRequestAt));

    if (waitMs) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    lastNominatimRequestAt = Date.now();
    return task();
  });

  geocodingQueue = queuedRequest.catch(() => {});
  return queuedRequest;
}

async function geocodeAddress(location) {
  const endereco = String(location?.endereco || '').trim();
  const numero = String(location?.numero || '').trim();
  const bairro = String(location?.bairro || '').trim();
  const cidade = String(location?.cidade || '').trim();
  const estado = String(location?.estado || '').trim().toUpperCase();
  const cep = formatCep(location?.cep);

  if (!endereco || !numero || !cidade || !estado) {
    throw new HttpError(400, 'Informe CEP e numero para localizar o espaco.');
  }

  const normalizedLocation = {
    cep,
    endereco,
    numero,
    bairro,
    cidade,
    estado,
  };
  const cacheKey = buildGeocodingCacheKey(normalizedLocation);

  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    addressdetails: '1',
    city: cidade,
    country: 'Brasil',
    countrycodes: 'br',
    format: 'jsonv2',
    limit: '1',
    postalcode: onlyDigits(cep),
    state: estado,
    street: `${numero} ${endereco}`,
  });
  if (process.env.GEOCODING_CONTACT_EMAIL) {
    params.set('email', process.env.GEOCODING_CONTACT_EMAIL);
  }
  const userAgent = process.env.GEOCODING_USER_AGENT || 'PlayArena/1.0';
  const results = await enqueueNominatimRequest(() => fetchJson(`${NOMINATIM_SEARCH_URL}?${params}`, {
    headers: {
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': userAgent,
    },
  }));
  const [result] = Array.isArray(results) ? results : [];
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new HttpError(422, 'Nao foi possivel localizar este CEP e numero no mapa. Confira os dados informados.');
  }

  const geocodedLocation = {
    ...normalizedLocation,
    endereco_completo: buildAddressLine(normalizedLocation),
    latitude,
    longitude,
    precisao: normalizeText(result?.address?.house_number) === normalizeText(numero)
      ? 'exata'
      : 'aproximada',
  };

  geocodingCache.set(cacheKey, geocodedLocation);
  return geocodedLocation;
}

async function resolveCourtLocation(location = {}) {
  const cepLocation = await lookupCep(location.cep);
  const endereco = cepLocation.endereco || String(location.endereco || '').trim();
  const bairro = cepLocation.bairro || String(location.bairro || '').trim();

  if (!endereco) {
    throw new HttpError(400, 'Este CEP nao possui logradouro. Informe o endereco completo.');
  }

  return geocodeAddress({
    ...cepLocation,
    endereco,
    bairro,
    numero: location.numero,
  });
}

module.exports = {
  buildAddressLine,
  formatCep,
  geocodeAddress,
  lookupCep,
  resolveCourtLocation,
};
