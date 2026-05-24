# Product Requirements

## 项目目标

构建一个精简版全栈 Web 应用。用户输入股票代码后，系统获取行情数据，调用自部署 LLM（OpenAI 兼容接口）生成结构化分析结果，并把分析记录保存到 Supabase。

项目重点展示：

- 前后端完整开发能力
- 第三方行情 API 调用能力
- 自部署 LLM（OpenAI 兼容）接入与 Prompt 控制能力
- JSON 结构化输出处理能力
- Supabase 数据存储能力
- Render 部署能力

## 目标用户

目标用户是面试官或测试用户。他们需要通过一个简单页面验证完整业务链路是否可用。

## 核心流程

1. 用户打开页面。
2. 用户输入股票代码，例如 `AAPL`、`TSLA`、`NVDA`。
3. 用户点击“分析股票”。
4. 前端调用后端分析接口。
5. 后端获取股票行情。
6. 后端调用自部署 LLM（OpenAI 兼容）生成分析 JSON。
7. 后端保存分析记录到 Supabase。
8. 前端展示本次分析结果。
9. 页面展示最近 10 条历史记录。

## 功能范围

MVP 必须包含：

- 股票代码输入和基础校验。
- 股票行情获取。
- AI 分析结果展示。
- 历史记录展示。
- 错误和 loading 状态。

暂不需要包含：

- 用户登录。
- 自选股列表。
- 图表分析。
- 投资建议。
- 多市场股票支持。

## 输出约束

LLM 返回内容必须是严格 JSON，不允许包含 Markdown、代码块或额外解释。

```json
{
  "summary": "string",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}
```
