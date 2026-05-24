# Acceptance Checklist

## MVP 功能验收

- 页面可以输入股票代码。
- 输入为空时有错误提示。
- 股票代码会自动转成大写。
- 点击分析后出现 loading 状态。
- 后端能获取股票行情数据。
- 后端能调用 LLM 并拿到 JSON 分析结果。
- 页面能展示行情和 AI 分析。
- Supabase 能保存每次分析记录。
- 页面能展示最近 10 条历史记录。

## 后端验收

- `POST /api/analyze` 支持成功和失败响应。
- `GET /api/history` 按 `created_at` 倒序返回。
- 缺少必要环境变量时有明确错误。
- 股票 API 失败时不会导致服务崩溃。
- LLM 返回 Markdown 或非法 JSON 时能被处理。
- LLM 网关地址错误、密钥错误时有明确错误信息。
- Supabase 写入失败时能返回可理解的错误。

## 前端验收

- 页面状态清晰：初始、loading、成功、失败。
- 错误信息对用户可读。
- 历史记录为空时有空状态。
- 移动端和桌面端都不出现明显布局错位。

## 安全与配置验收

- 仓库包含 `.env.example`。
- 仓库不包含真实 `.env`。
- 仓库不包含 `node_modules`、`dist`、`.next`。
- API Key 不会暴露到前端代码。
- 后端环境变量包含 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`。

## 交付验收

- README 包含项目介绍。
- README 包含本地运行方式。
- README 包含环境变量说明。
- README 包含部署说明。
- README 包含 Debug 记录。
- Render 部署后可以在线访问。
