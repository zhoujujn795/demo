# Technical Architecture

## 推荐技术栈

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Supabase PostgreSQL
- LLM: 自部署模型服务（OpenAI 兼容接口）
- Stock Data: `yfinance`（Python 库，Yahoo Finance 开源数据抓取）
- Deploy: Render.com

## 推荐项目结构

```text
ai-stock-dashboard/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── index.html
│   └── package.json
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
├── docs/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 前端职责

- 管理股票代码输入。
- 显示 loading、错误、结果和历史记录。
- 调用后端 API，不直接访问股票 API、LLM 或 Supabase。
- 将股票代码统一转成大写。

## 后端职责

- 暴露 `POST /api/analyze` 和 `GET /api/history`。
- 校验请求参数。
- 调用行情服务。
- 调用 LLM 并校验 JSON 输出。
- 保存和读取 Supabase 记录。
- 屏蔽密钥和第三方 API 细节。

## 配置原则

所有密钥通过环境变量读取。仓库只提交 `.env.example`，不能提交真实 `.env`。

推荐最小变量集：

- `LLM_BASE_URL`: 自部署 LLM 网关地址，例如 `http://your-llm-host:8000/v1`
- `LLM_API_KEY`: 访问密钥（如网关要求）
- `LLM_MODEL`: 模型名称，例如 `qwen2.5-72b-instruct`
