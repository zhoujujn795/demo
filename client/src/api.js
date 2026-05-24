const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({
    success: false,
    error: '服务返回了无效响应。',
  }));

  if (!response.ok) {
    throw new Error(payload.error || '请求失败。');
  }

  return payload;
}

export async function analyzeStock(symbol) {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
}

export async function analyzeStocksBatch(symbols) {
  return request('/api/analyze/batch', {
    method: 'POST',
    body: JSON.stringify({ symbols }),
  });
}

export async function getHistory() {
  return request('/api/history');
}

export async function getStockSeries(symbol, period = '1mo') {
  const params = new URLSearchParams({ symbol, period });
  return request(`/api/series?${params.toString()}`);
}

export async function getWatchlist() {
  return request('/api/watchlist');
}

export async function addWatchlist(symbol) {
  return request('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
}

export async function removeWatchlist(symbol) {
  return request(`/api/watchlist/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  });
}
