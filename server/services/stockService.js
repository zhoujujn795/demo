import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const yfinanceScriptPath = path.resolve(__dirname, '../scripts/fetch_quote_yfinance.py');
const yfinanceHistoryScriptPath = path.resolve(__dirname, '../scripts/fetch_history_yfinance.py');

function serviceError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readStockConfig() {
  const provider = (process.env.STOCK_API_PROVIDER || 'yfinance').toLowerCase();
  const apiKey = process.env.STOCK_API_KEY;

  if (!['yfinance', 'alphavantage', 'twelvedata'].includes(provider)) {
    throw serviceError('Unsupported STOCK_API_PROVIDER', 500);
  }
  if (provider !== 'yfinance' && !apiKey) {
    throw serviceError('Missing STOCK_API_KEY', 500);
  }

  return { provider, apiKey };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw serviceError(`Stock API request failed with ${response.status}`, 502);
  }

  return payload;
}

function parseAlphaVantage(payload, symbol) {
  const quote = payload?.['Global Quote'];
  if (!quote || !quote['05. price']) {
    const detail = payload?.Note || payload?.Information || payload?.Error || 'empty quote payload';
    throw serviceError(`Stock API returned invalid data: ${detail}`, 502);
  }

  const changePercent = String(quote['10. change percent'] || '').replace('%', '');
  return {
    companyName: String(quote['01. symbol'] || symbol),
    price: toNumber(quote['05. price']),
    change: toNumber(quote['09. change']),
    changePercent: toNumber(changePercent),
    volume: toNumber(quote['06. volume']),
    latestTradingDay: String(quote['07. latest trading day'] || ''),
  };
}

function parseTwelveData(payload, symbol) {
  if (!payload || !payload.close) {
    const detail = payload?.message || payload?.status || 'empty quote payload';
    throw serviceError(`Stock API returned invalid data: ${detail}`, 502);
  }

  const changePercent = String(payload.percent_change || '').replace('%', '');
  const latestTradingDay = String(payload.datetime || '').split(' ')[0];
  return {
    companyName: symbol,
    price: toNumber(payload.close),
    change: toNumber(payload.change),
    changePercent: toNumber(changePercent),
    volume: toNumber(payload.volume),
    latestTradingDay,
  };
}

async function fetchFromYfinance(symbol) {
  const pythonBin = process.env.PYTHON_BIN || 'python';
  try {
    const { stdout } = await execFileAsync(pythonBin, [yfinanceScriptPath, symbol], {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
    });
    const parsed = JSON.parse(String(stdout || '{}').trim());
    if (parsed?.price === undefined || parsed?.price === null) throw new Error('price is missing');
    return {
      companyName: String(parsed.companyName || symbol),
      price: toNumber(parsed.price),
      change: toNumber(parsed.change),
      changePercent: toNumber(parsed.changePercent),
      volume: toNumber(parsed.volume),
      latestTradingDay: String(parsed.latestTradingDay || ''),
    };
  } catch (error) {
    const stderr = String(error?.stderr || '');
    if (stderr.includes('No module named') && stderr.includes('yfinance')) {
      throw serviceError('yfinance is not installed. Run: pip install yfinance', 500);
    }
    throw serviceError(`yfinance quote fetch failed: ${stderr || error.message}`, 502);
  }
}

async function fetchHistoryFromYfinance(symbol, period = '1mo') {
  const pythonBin = process.env.PYTHON_BIN || 'python';
  try {
    const { stdout } = await execFileAsync(pythonBin, [yfinanceHistoryScriptPath, symbol, period], {
      timeout: 25000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const parsed = JSON.parse(String(stdout || '{}').trim());
    if (!Array.isArray(parsed?.series)) throw new Error('series is missing');
    const series = parsed.series.map((item) => ({
      date: String(item.date || ''),
      close: toNumber(item.close),
      volume: toNumber(item.volume),
    })).filter((item) => item.date && item.close !== null);
    return {
      companyName: String(parsed.companyName || symbol),
      series,
    };
  } catch (error) {
    const stderr = String(error?.stderr || '');
    if (stderr.includes('No module named') && stderr.includes('yfinance')) {
      throw serviceError('yfinance is not installed. Run: pip install yfinance', 500);
    }
    throw serviceError(`yfinance history fetch failed: ${stderr || error.message}`, 502);
  }
}

async function fetchFromAlphaVantage(symbol, apiKey) {
  const baseUrl = process.env.STOCK_API_BASE_URL || 'https://www.alphavantage.co/query';
  const url = new URL(baseUrl);
  url.searchParams.set('function', 'GLOBAL_QUOTE');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);
  const payload = await fetchJson(url.toString());
  return parseAlphaVantage(payload, symbol);
}

async function fetchFromTwelveData(symbol, apiKey) {
  const baseUrl = process.env.STOCK_API_BASE_URL || 'https://api.twelvedata.com/quote';
  const url = new URL(baseUrl);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);
  const payload = await fetchJson(url.toString());
  return parseTwelveData(payload, symbol);
}

export async function fetchStockQuote(symbol) {
  const { provider, apiKey } = readStockConfig();

  if (provider === 'yfinance') return fetchFromYfinance(symbol);
  if (provider === 'twelvedata') return fetchFromTwelveData(symbol, apiKey);
  return fetchFromAlphaVantage(symbol, apiKey);
}

export async function fetchStockHistory(symbol, period = '1mo') {
  const { provider } = readStockConfig();
  if (provider !== 'yfinance') {
    throw serviceError('Stock history is currently supported only when STOCK_API_PROVIDER=yfinance', 400);
  }
  return fetchHistoryFromYfinance(symbol, period);
}
