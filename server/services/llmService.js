import { buildStockAnalysisMessages } from '../prompts/stockAnalysisPrompt.js';

const ALLOWED_SENTIMENT = new Set(['Bullish', 'Neutral', 'Bearish']);
const ALLOWED_RISK = new Set(['Low', 'Medium', 'High']);
const CN_CHAR_REGEX = /[\u4e00-\u9fff]/;
const SUMMARY_MIN_LENGTH = 70;
const SUMMARY_MAX_LENGTH = 180;

function serviceError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function readLlmConfig() {
  const baseUrl = String(process.env.LLM_BASE_URL || '').trim();
  const apiKey = String(process.env.LLM_API_KEY || '').trim();
  const model = String(process.env.LLM_MODEL || '').trim();

  if (!baseUrl) throw serviceError('Missing LLM_BASE_URL', 500);
  if (!apiKey) throw serviceError('Missing LLM_API_KEY', 500);
  if (!model) throw serviceError('Missing LLM_MODEL', 500);

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
    model,
  };
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw serviceError('LLM returned empty content', 502);

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) return candidate.slice(start, end + 1);

  throw serviceError('LLM did not return JSON content', 502);
}

function validateAnalysisObject(obj) {
  if (!obj || typeof obj !== 'object') throw serviceError('LLM JSON is invalid', 502);

  const summary = String(obj.summary || '').trim();
  const sentiment = String(obj.sentiment || '').trim();
  const riskLevel = String(obj.risk_level || '').trim();

  if (!summary) throw serviceError('LLM JSON missing summary', 502);
  if (!CN_CHAR_REGEX.test(summary)) throw serviceError('LLM summary must be Chinese', 502);
  if (summary.length < SUMMARY_MIN_LENGTH) throw serviceError('LLM summary is too short', 502);
  if (summary.length > SUMMARY_MAX_LENGTH) throw serviceError('LLM summary is too long', 502);
  if (!ALLOWED_SENTIMENT.has(sentiment)) throw serviceError('LLM JSON has invalid sentiment', 502);
  if (!ALLOWED_RISK.has(riskLevel)) throw serviceError('LLM JSON has invalid risk_level', 502);

  return {
    summary,
    sentiment,
    risk_level: riskLevel,
  };
}

export async function analyzeSymbolWithLlm(symbol, stockData) {
  const { baseUrl, apiKey, model } = readLlmConfig();
  const messages = buildStockAnalysisMessages(symbol, stockData);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
    }),
    signal: AbortSignal.timeout(30000),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorText = payload?.error?.message || `LLM request failed with ${response.status}`;
    throw serviceError(errorText, 502);
  }

  const content = payload?.choices?.[0]?.message?.content;
  const jsonText = extractJsonObject(content);

  let parsed = null;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw serviceError('LLM JSON parse failed', 502);
  }

  return validateAnalysisObject(parsed);
}
