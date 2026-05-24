# Codex Implementation Tasks

## Phase 1: Project Scaffold

目标：建立可运行的前后端骨架。

Codex 任务：

- 创建 `client/` React + Vite 项目。
- 创建 `server/` Express 项目。
- 增加根目录 `.gitignore`、`.env.example`、`README.md`。
- 配置本地开发命令。

验收：

- 前端页面可以启动。
- 后端健康检查接口可以访问。
- README 包含本地启动方式。

## Phase 2: Mock Analysis Flow

目标：先用假数据打通页面和接口。

Codex 任务：

- 实现 `POST /api/analyze`，返回固定股票数据和固定分析结果。
- 实现前端输入、loading、错误和结果展示。
- 实现 `GET /api/history` 的 mock 返回。

验收：

- 输入 `AAPL` 后页面能展示分析结果。
- 空输入会在前端提示错误。

## Phase 3: Real Service Integration

目标：接入真实第三方服务。

Codex 任务：

- 实现 `stockService.js` 调用免费股票行情 API。
- 优先使用 `yfinance`（Yahoo Finance 开源 Python 库）获取行情数据。
- 实现 `llmService.js` 调用自部署 LLM（OpenAI 兼容接口）。
- 实现 LLM JSON 清洗、解析和字段校验。
- 实现 `supabaseService.js` 保存和读取记录。
- 增加 LLM 配置校验（`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`）。

验收：

- 后端能返回真实行情数据。
- LLM 输出非法 JSON 时有明确错误。
- LLM 网关不可达或鉴权失败时有明确错误。
- Supabase 能保存分析记录。

## Phase 4: Polish and Deployment

目标：完善面试交付物。

Codex 任务：

- 完善页面样式和响应式布局。
- 补充 README 的部署、环境变量和 Debug 记录。
- 准备 Render 部署说明。

验收：

- 项目可部署。
- README 可让第三方独立运行项目。
