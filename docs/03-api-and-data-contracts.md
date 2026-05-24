# API and Data Contracts

## POST /api/analyze

用于分析单个股票。

Request:

```json
{
  "symbol": "AAPL"
}
```

Success Response:

```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "stock_data": {
      "price": 190.5,
      "change": 2.1,
      "changePercent": 1.12,
      "volume": 50000000,
      "latestTradingDay": "2026-05-22"
    },
    "analysis": {
      "summary": "The stock shows positive short-term momentum.",
      "sentiment": "Bullish",
      "risk_level": "Medium"
    }
  }
}
```

Error Response:

```json
{
  "success": false,
  "error": "Unable to analyze stock"
}
```

## GET /api/history

用于获取最近 10 条分析记录。

Success Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "symbol": "AAPL",
      "summary": "The stock shows positive short-term momentum.",
      "sentiment": "Bullish",
      "risk_level": "Medium",
      "created_at": "2026-05-22T12:00:00Z"
    }
  ]
}
```

## LLM 调用约定（OpenAI 兼容）

后端 `llmService` 统一走 OpenAI 兼容格式，建议调用：

- `POST {LLM_BASE_URL}/chat/completions`
- Header: `Authorization: Bearer {LLM_API_KEY}`
- Body: 使用 `model`、`messages`、`temperature` 等标准字段

示例请求体：

```json
{
  "model": "qwen2.5-72b-instruct",
  "temperature": 0.2,
  "messages": [
    { "role": "system", "content": "You are a financial analysis assistant." },
    { "role": "user", "content": "..." }
  ]
}
```

环境变量建议：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

## Supabase 表设计

表名：`stock_analyses`

```sql
id uuid primary key default gen_random_uuid(),
symbol text not null,
stock_data jsonb not null,
summary text not null,
sentiment text not null,
risk_level text not null,
created_at timestamp with time zone default now()
```

## 枚举约束

- `sentiment`: `Bullish`, `Neutral`, `Bearish`
- `risk_level`: `Low`, `Medium`, `High`
