import express from 'express';
import { analyzeSymbolWithLlm } from '../services/llmService.js';
import { fetchStockHistory, fetchStockQuote } from '../services/stockService.js';
import { getRecentAnalyses, saveStockAnalysis } from '../services/supabaseService.js';
import { addWatchlistSymbol, getWatchlistSymbols, removeWatchlistSymbol } from '../services/watchlistService.js';

const router = express.Router();
const symbolPattern = /^[A-Z0-9.\-]{1,16}$/;

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

router.post('/analyze', async (req, res, next) => {
  try {
    const symbol = String(req.body?.symbol || '').trim().toUpperCase();
    if (!symbol) throw badRequest('symbol is required');
    if (!symbolPattern.test(symbol)) throw badRequest('symbol format is invalid');

    const stockData = await fetchStockQuote(symbol);
    const analysis = await analyzeSymbolWithLlm(symbol, stockData);

    await saveStockAnalysis({
      symbol,
      stockData,
      analysis,
    });

    res.json({
      success: true,
      data: {
        symbol,
        company_name: stockData.companyName || symbol,
        stock_data: stockData,
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/analyze/batch', async (req, res, next) => {
  try {
    const inputSymbols = Array.isArray(req.body?.symbols) ? req.body.symbols : [];
    const symbols = inputSymbols.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean);
    if (!symbols.length) throw badRequest('symbols is required');
    if (symbols.length > 10) throw badRequest('symbols size exceeds limit 10');

    const uniqueSymbols = [...new Set(symbols)];
    uniqueSymbols.forEach((item) => {
      if (!symbolPattern.test(item)) throw badRequest('symbol format is invalid');
    });

    const results = [];
    for (const symbol of uniqueSymbols) {
      try {
        const stockData = await fetchStockQuote(symbol);
        const analysis = await analyzeSymbolWithLlm(symbol, stockData);
        await saveStockAnalysis({ symbol, stockData, analysis });
        results.push({
          symbol,
          success: true,
          stock_data: stockData,
          analysis,
        });
      } catch (error) {
        results.push({
          symbol,
          success: false,
          error: error.message || 'analyze failed',
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (_req, res, next) => {
  try {
    const data = await getRecentAnalyses();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/watchlist', async (_req, res, next) => {
  try {
    const symbols = await getWatchlistSymbols();
    res.json({ success: true, data: symbols });
  } catch (error) {
    next(error);
  }
});

router.post('/watchlist', async (req, res, next) => {
  try {
    const symbol = String(req.body?.symbol || '').trim().toUpperCase();
    if (!symbol) throw badRequest('symbol is required');
    const symbols = await addWatchlistSymbol(symbol);
    res.json({ success: true, data: symbols });
  } catch (error) {
    next(error);
  }
});

router.delete('/watchlist/:symbol', async (req, res, next) => {
  try {
    const symbol = String(req.params?.symbol || '').trim().toUpperCase();
    if (!symbol) throw badRequest('symbol is required');
    const symbols = await removeWatchlistSymbol(symbol);
    res.json({ success: true, data: symbols });
  } catch (error) {
    next(error);
  }
});

router.get('/series', async (req, res, next) => {
  try {
    const symbol = String(req.query?.symbol || '').trim().toUpperCase();
    const period = String(req.query?.period || '1mo').trim();
    if (!symbol) throw badRequest('symbol is required');
    if (!symbolPattern.test(symbol)) throw badRequest('symbol format is invalid');
    if (!['5d', '1mo', '3mo', '6mo', '1y'].includes(period)) throw badRequest('period is invalid');

    const historyData = await fetchStockHistory(symbol, period);
    res.json({
      success: true,
      data: {
        symbol,
        period,
        company_name: historyData.companyName || symbol,
        series: historyData.series || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
