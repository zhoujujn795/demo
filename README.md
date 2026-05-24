# AI 股票分析面板

一个精简的全栈面板：输入股票代码，后端获取行情并调用自部署 LLM（OpenAI 兼容接口）生成结构化分析结果，并保存到 Supabase。生产部署时由 Express 同时托管 API 和前端静态资源。

## 当前进度

- Phase 1 已完成：前端骨架、后端骨架、环境变量模板、本地开发命令。
- Phase 2 已完成：`POST /api/analyze` 与 `GET /api/history` 页面联调。
- Phase 3 已完成：行情 API、自部署 OpenAI 兼容 LLM、Supabase 服务集成（需配置环境变量后可用）。
- Phase 4 已完成：界面细节优化、README 交付信息补齐、Render 部署配置。

## 项目结构

```text
.
├── client/         # React + Vite
├── server/         # Express API
├── docs/           # 需求与实现文档
├── .env.example
└── package.json    # 根命令入口
```

## 本地运行

前置要求：

- Node.js 20+
- npm 10+

安装依赖：

```bash
npm --prefix client install
npm --prefix server install
```

启动前端：

```bash
npm run dev:client
```

启动后端：

```bash
npm run dev:server
```

前端默认请求后端地址 `http://127.0.0.1:3001`，如需修改可设置 `VITE_API_BASE_URL`。

后端健康检查：

```bash
GET http://127.0.0.1:3001/api/health
```

## 环境变量

复制 `.env.example` 按需填写。关键变量：

- `STOCK_API_PROVIDER` (`yfinance`、`alphavantage` 或 `twelvedata`，默认 `yfinance`)
- `PYTHON_BIN`（可选，默认 `python`）
- `STOCK_API_BASE_URL`（可选，仅 `alphavantage` / `twelvedata` 使用）
- `STOCK_API_KEY`（仅 `alphavantage` / `twelvedata` 必填）
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

推荐最小可运行组合：

- 行情（yfinance）：`STOCK_API_PROVIDER=yfinance`，并在 Python 环境安装 `yfinance`
- 行情（第三方 API）：`STOCK_API_PROVIDER` + `STOCK_API_KEY`
- LLM：`LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL`
- 存储：`SUPABASE_URL` + `SUPABASE_ANON_KEY`

yfinance 安装命令：

```bash
pip install yfinance
```

## Render 部署

仓库已提供 [render.yaml](</G:/demo/render.yaml>)。推荐直接用 Blueprint 创建服务。

关键点：

1. Build Command: `npm --prefix client install && npm --prefix server install && npm run build`
2. Start Command: `npm run start:server`
3. 运行时端口：Render 会注入 `PORT`，后端已兼容。
4. 环境变量：按 `.env.example` 在 Render Dashboard 配置。

部署完成后：

- API 健康检查：`/api/health`
- 页面入口：`/`

## Debug 记录

问题 1：LLM 可能返回 Markdown 代码块或非 JSON 文本，导致解析失败。  
处理：后端先做 JSON 提取，再进行 `JSON.parse`，并校验 `summary/sentiment/risk_level` 枚举约束。

问题 2：缺少环境变量时定位困难。  
处理：后端在服务层显式检查变量，返回明确错误，如 `Missing LLM_MODEL`、`Missing SUPABASE_URL`。

问题 3：本地与部署环境请求入口不一致。  
处理：前端 API 基址可通过 `VITE_API_BASE_URL` 覆盖；生产默认由同一 Express 服务托管页面和 API。
