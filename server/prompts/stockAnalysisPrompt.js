export function buildStockAnalysisMessages(symbol, stockData) {
  return [
    {
      role: 'system',
      content:
        'You are a financial analysis assistant. Return ONLY valid JSON. Do not return markdown, code fences, or explanations outside JSON.',
    },
    {
      role: 'user',
      content: `Analyze this stock quote and return exactly this JSON schema:
{
  "summary": "string, Chinese only, 70-180 Chinese characters",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}

Rules:
- summary must be in Simplified Chinese only.
- summary length must be between 70 and 180 Chinese characters.
- summary must include: trend interpretation, volume/price relationship, and at least one clear risk point.
- summary should be specific, not generic, and avoid repeating the same phrase.
- sentiment must be one of Bullish, Neutral, Bearish.
- risk_level must be one of Low, Medium, High.
- do not provide buy/sell advice.

symbol: ${symbol}
stock_data: ${JSON.stringify(stockData)}`,
    },
  ];
}
