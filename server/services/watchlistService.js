import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const watchlistFile = path.join(dataDir, 'watchlist.json');
const symbolPattern = /^[A-Z0-9.\-]{1,16}$/;

function serviceError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeSymbol(value) {
  return String(value || '').trim().toUpperCase();
}

function validateSymbol(symbol) {
  if (!symbolPattern.test(symbol)) throw serviceError('symbol format is invalid', 400);
}

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(watchlistFile);
  } catch {
    await fs.writeFile(watchlistFile, JSON.stringify({ symbols: [] }, null, 2), 'utf-8');
  }
}

async function readStore() {
  await ensureStore();
  const text = await fs.readFile(watchlistFile, 'utf-8');
  const parsed = JSON.parse(text || '{}');
  const symbols = Array.isArray(parsed.symbols) ? parsed.symbols : [];
  return symbols.map(normalizeSymbol).filter(Boolean);
}

async function writeStore(symbols) {
  await ensureStore();
  await fs.writeFile(watchlistFile, JSON.stringify({ symbols }, null, 2), 'utf-8');
}

export async function getWatchlistSymbols() {
  return readStore();
}

export async function addWatchlistSymbol(inputSymbol) {
  const symbol = normalizeSymbol(inputSymbol);
  validateSymbol(symbol);
  const symbols = await readStore();
  if (!symbols.includes(symbol)) symbols.push(symbol);
  await writeStore(symbols);
  return symbols;
}

export async function removeWatchlistSymbol(inputSymbol) {
  const symbol = normalizeSymbol(inputSymbol);
  validateSymbol(symbol);
  const symbols = await readStore();
  const nextSymbols = symbols.filter((item) => item !== symbol);
  await writeStore(nextSymbols);
  return nextSymbols;
}
