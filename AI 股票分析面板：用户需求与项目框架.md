# AI 股票分析面板：用户需求与项目框架

## 1. 项目目标

构建一个精简版全栈 Web 应用，用户可以输入股票代码，系统自动获取股票行情数据，并调用 LLM 对股票数据进行分析，最终返回结构化 JSON 分析结果，同时将分析记录保存到 Supabase 数据库中。

项目用于面试技术评估，重点展示：

- 前后端完整开发能力
- 第三方 API 调用能力
- LLM Prompt 控制能力
- JSON 结构化输出处理能力
- Supabase 数据存储能力
- Render.com 部署能力
- GitHub 工程提交与 README 编写能力

------

## 2. 用户需求

### 2.1 目标用户

面试官 / 测试用户。

用户希望通过一个简单页面输入股票代码，例如 `AAPL`、`TSLA`、`NVDA`，点击按钮后看到该股票的基础行情信息和 AI 分析结果。

------

## 3. 核心用户流程

### 流程一：股票分析

1. 用户打开网页。
2. 用户在输入框中输入股票代码。
3. 用户点击“分析股票”按钮。
4. 前端调用后端接口。
5. 后端调用免费股票行情 API 获取行情数据。
6. 后端将行情数据发送给 LLM。
7. LLM 必须返回严格 JSON 格式。
8. 后端解析 JSON。
9. 后端将分析结果保存到 Supabase。
10. 前端展示股票行情和 AI 分析结果。

------

### 流程二：查看历史记录

1. 用户打开页面。
2. 页面自动加载最近分析过的股票记录。
3. 用户可以看到历史股票代码、分析时间、情绪判断、风险等级和总结。

------

## 4. 功能需求

### 4.1 股票代码输入

用户可以输入股票代码。

要求：

- 输入框不能为空。
- 自动转成大写。
- 支持常见美股代码，例如 `AAPL`、`MSFT`、`GOOGL`、`TSLA`、`NVDA`。
- 如果用户输入为空，前端提示错误。

------

### 4.2 获取股票行情数据

系统需要调用一个免费行情 API 获取股票数据。

可选 API：

- Alpha Vantage
- Finnhub
- Twelve Data
- Yahoo Finance 非官方包

建议优先使用免费 API，返回数据至少包含：

```
{
  "symbol": "AAPL",
  "price": 190.5,
  "change": 2.1,
  "changePercent": 1.12,
  "volume": 50000000,
  "latestTradingDay": "2026-05-22"
}
```

如果 API 返回失败，系统需要给出错误提示。

------

### 4.3 AI 股票分析

用户点击按钮后，系统调用 LLM API 分析股票行情数据。

LLM 必须返回严格 JSON，不允许返回 Markdown，不允许返回解释性文字。

目标 JSON 格式：

```
{
  "summary": "This stock shows short-term positive momentum based on the latest price movement and volume.",
  "sentiment": "Bullish",
  "risk_level": "Medium"
}
```

字段要求：

- `summary`: 字符串，股票分析总结
- `sentiment`: 只能是 `Bullish`、`Neutral`、`Bearish`
- `risk_level`: 只能是 `Low`、`Medium`、`High`

------

### 4.4 保存到 Supabase

每次分析完成后，需要将结果保存到 Supabase。

建议表名：

```
stock_analyses
```

字段设计：

```
id uuid primary key default gen_random_uuid(),
symbol text not null,
stock_data jsonb not null,
summary text not null,
sentiment text not null,
risk_level text not null,
created_at timestamp with time zone default now()
```

------

### 4.5 历史记录展示

页面展示最近 10 条分析记录。

展示字段：

- 股票代码
- 分析总结
- 情绪判断
- 风险等级
- 分析时间

------

## 5. 非功能需求

### 5.1 部署要求

项目需要部署到 Render.com。

提交时需要提供：

```
在线访问 URL
GitHub 仓库链接
```

------

### 5.2 README 要求

README 必须包含：

1. 项目介绍
2. 在线访问 URL
3. 技术栈
4. 本地运行方式
5. 环境变量说明
6. LLM Prompt 截图或代码
7. Debug 记录
8. 部署说明

------

### 5.3 安全要求

不能上传真实密钥。

仓库必须包含：

```
.env.example
```

不能提交：

```
.env
node_modules
dist
.next
```

------

## 6. 推荐技术栈

### 前端

```
React + Vite
```

原因：

- 启动快
- 结构简单
- 适合 48 小时面试项目
- 部署方便

------

### 后端

```
Node.js + Express
```

原因：

- API 写法简单
- 适合调用股票 API、LLM API 和 Supabase
- Render 部署方便

------

### 数据库

```
Supabase PostgreSQL
```

用途：

- 存储股票分析记录
- 使用 Supabase JS SDK 操作数据库

------

### LLM API

可选：

```
OpenAI / Claude / Gemini
```

建议用你当前最方便拿到 API Key 的服务。

------

### 部署平台

```
Render.com
```

建议部署方式：

- 前后端合并成一个项目部署
- Express 提供 API
- Vite 构建静态页面
- Render 启动 Node 服务

------

## 7. 推荐项目结构

```
ai-stock-dashboard/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── stock.js
│   ├── services/
│   │   ├── stockService.js
│   │   ├── llmService.js
│   │   └── supabaseService.js
│   └── prompts/
│       └── stockAnalysisPrompt.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

------

## 8. 后端接口设计

### 8.1 分析股票接口

```
POST /api/analyze
```

请求体：

```
{
  "symbol": "AAPL"
}
```

返回：

```
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "stock_data": {
      "price": 190.5,
      "change": 2.1,
      "changePercent": 1.12,
      "volume": 50000000
    },
    "analysis": {
      "summary": "The stock shows positive short-term momentum.",
      "sentiment": "Bullish",
      "risk_level": "Medium"
    }
  }
}
```

------

### 8.2 获取历史记录接口

```
GET /api/history
```

返回：

```
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

------

## 9. LLM Prompt 设计

建议 Prompt：

```
You are a financial analysis assistant.

Analyze the following stock market data and return ONLY valid JSON.

Do not include markdown.
Do not include code fences.
Do not include explanations outside JSON.
Do not include any extra text before or after the JSON.

The JSON format must be exactly:

{
  "summary": "string",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}

Rules:
- summary should be concise and based only on the provided stock data.
- sentiment must be one of: Bullish, Neutral, Bearish.
- risk_level must be one of: Low, Medium, High.
- Do not provide financial advice.
- Do not recommend buying or selling.

Stock data:
{{STOCK_DATA}}
```

------

## 10. 错误处理需求

需要处理以下错误：

### 前端错误

- 股票代码为空
- 请求失败
- 后端返回错误
- 分析中显示 loading 状态

### 后端错误

- 股票 API 请求失败
- LLM API 请求失败
- LLM 返回内容不是合法 JSON
- Supabase 写入失败
- 缺少环境变量

------

## 11. README 中的 Debug 记录示例

可以写：

```
Debug 记录：

问题：
LLM 有时会返回 Markdown 代码块，例如 ```json，导致 JSON.parse 报错。

解决：
我在 Prompt 中明确要求：
Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.

同时在后端增加了 JSON 清洗逻辑，去除 ```json 和 ``` 后再解析。
```

也可以写：

```
问题：
前端本地请求后端接口正常，但部署到 Render 后出现 CORS 报错。

解决：
在 Express 中安装并配置 cors 中间件，允许前端域名访问后端 API。
```

------

## 12. MVP 完成标准

项目完成后需要满足：

- 可以在线访问
- 可以输入股票代码
- 可以获取股票行情
- 可以调用 LLM 分析
- LLM 返回 JSON
- 页面展示分析结果
- Supabase 保存分析记录
- 页面展示历史记录
- README 完整
- GitHub 仓库可访问
- `.env` 没有泄露密钥