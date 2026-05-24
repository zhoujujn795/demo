import { useEffect, useMemo, useState } from 'react';
import {
  addWatchlist,
  analyzeStock,
  analyzeStocksBatch,
  getHistory,
  getStockSeries,
  getWatchlist,
  removeWatchlist,
} from './api';

const sentimentLabelMap = {
  Bullish: '看涨',
  Neutral: '中性',
  Bearish: '看跌',
};

const riskLabelMap = {
  Low: '低',
  Medium: '中',
  High: '高',
};

const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(value);

const formatDate = (value) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const sentimentOrder = ['Bullish', 'Neutral', 'Bearish'];
const riskOrder = ['Low', 'Medium', 'High'];
const bridgeSteps = ['正在抓取最新行情', '正在整理关键指标', '正在生成 AI 结论'];
const heroTitle = '简洁行情解读，结构化快速查看。';

function toPercent(value, total) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [result, setResult] = useState(null);
  const [analyzedSymbol, setAnalyzedSymbol] = useState('');
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [batchInput, setBatchInput] = useState('');
  const [activeView, setActiveView] = useState('analysis');
  const [formError, setFormError] = useState('');
  const [batchNotice, setBatchNotice] = useState('');
  const [historyNotice, setHistoryNotice] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [seriesPeriod, setSeriesPeriod] = useState('1mo');
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesNotice, setSeriesNotice] = useState('');
  const [seriesCompanyName, setSeriesCompanyName] = useState('');
  const [series, setSeries] = useState([]);
  const [bridgeStepIndex, setBridgeStepIndex] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getHistory()
      .then((response) => {
        if (response.success) setHistory(response.data);
      })
      .catch((err) => {
        setHistoryNotice(err.message || '加载历史记录失败。');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, []);

  useEffect(() => {
    getWatchlist()
      .then((response) => {
        if (response.success) setWatchlist(response.data);
      })
      .catch(() => {
        // Ignore watchlist init errors to avoid blocking other flows.
      })
      .finally(() => {
        setWatchlistLoading(false);
      });
  }, []);

  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);
  const canLoadSeries = Boolean(analyzedSymbol);
  const sampleSize = history.length;
  const periodOptions = ['5d', '1mo', '3mo', '6mo', '1y'];

  const sentimentMetrics = useMemo(() => {
    const counts = { Bullish: 0, Neutral: 0, Bearish: 0 };
    history.forEach((item) => {
      if (counts[item.sentiment] !== undefined) counts[item.sentiment] += 1;
    });
    return sentimentOrder.map((key) => ({
      key,
      label: sentimentLabelMap[key],
      count: counts[key],
      percent: toPercent(counts[key], sampleSize),
    }));
  }, [history, sampleSize]);

  const riskMetrics = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    history.forEach((item) => {
      if (counts[item.risk_level] !== undefined) counts[item.risk_level] += 1;
    });
    return riskOrder.map((key) => ({
      key,
      label: riskLabelMap[key],
      count: counts[key],
      percent: toPercent(counts[key], sampleSize),
    }));
  }, [history, sampleSize]);

  const overviewStats = useMemo(() => {
    const bullishCount = sentimentMetrics.find((item) => item.key === 'Bullish')?.count || 0;
    const highRiskCount = riskMetrics.find((item) => item.key === 'High')?.count || 0;

    let riskWeightedTotal = 0;
    history.forEach((item) => {
      if (item.risk_level === 'Low') riskWeightedTotal += 1;
      else if (item.risk_level === 'Medium') riskWeightedTotal += 2;
      else if (item.risk_level === 'High') riskWeightedTotal += 3;
    });
    const avgRisk = sampleSize ? Number((riskWeightedTotal / sampleSize).toFixed(2)) : 0;
    const latestSymbol = history[0]?.symbol || '-';

    return {
      sampleSize,
      bullishRatio: toPercent(bullishCount, sampleSize),
      highRiskRatio: toPercent(highRiskCount, sampleSize),
      avgRisk,
      latestSymbol,
    };
  }, [history, sampleSize, sentimentMetrics, riskMetrics]);

  const chartGeometry = useMemo(() => {
    const width = 720;
    const height = 260;
    const padding = 18;
    if (!series.length) return { width, height, linePath: '', areaPath: '', points: [], minClose: 0, maxClose: 0 };

    const closes = series.map((item) => Number(item.close || 0));
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const xStep = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
    const yRange = maxClose - minClose || 1;

    const points = series.map((item, index) => {
      const x = padding + xStep * index;
      const y = height - padding - (((Number(item.close || 0) - minClose) / yRange) * (height - padding * 2));
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

    return { width, height, linePath, areaPath, points, minClose, maxClose };
  }, [series]);

  useEffect(() => {
    if (activeView !== 'visual') return;
    if (!canLoadSeries) {
      setSeries([]);
      setSeriesCompanyName('');
      setSeriesNotice('');
      setSeriesLoading(false);
      return;
    }
    const targetSymbol = analyzedSymbol;
    setSeriesLoading(true);
    setSeriesNotice('');
    getStockSeries(targetSymbol, seriesPeriod)
      .then((response) => {
        if (response.success) {
          setSeries(response.data.series || []);
          setSeriesCompanyName(response.data.company_name || response.data.symbol || targetSymbol);
        }
      })
      .catch((err) => {
        setSeries([]);
        setSeriesCompanyName('');
        setSeriesNotice(err.message || '加载历史行情失败。');
      })
      .finally(() => {
        setSeriesLoading(false);
      });
  }, [activeView, canLoadSeries, analyzedSymbol, seriesPeriod]);

  useEffect(() => {
    if (!loading) return undefined;
    setBridgeStepIndex(0);
    const timer = setInterval(() => {
      setBridgeStepIndex((index) => Math.min(index + 1, bridgeSteps.length - 1));
    }, 1100);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!normalizedSymbol) {
      setFormError('请输入股票代码。');
      return;
    }

    await runAnalyze(normalizedSymbol);
  }

  async function runAnalyze(targetSymbol) {
    const startedAt = Date.now();
    setLoading(true);
    try {
      const response = await analyzeStock(targetSymbol);
      if (!response.success) throw new Error(response.error || '股票分析失败。');

      setResult(response.data);
      setAnalyzedSymbol(response.data.symbol);
      setHistoryNotice('');
      setHistory((items) => [
        {
          id: `${response.data.symbol}-${Date.now()}`,
          symbol: response.data.symbol,
          company_name: response.data.company_name || response.data.stock_data?.companyName || response.data.symbol,
          summary: response.data.analysis.summary,
          sentiment: response.data.analysis.sentiment,
          risk_level: response.data.analysis.risk_level,
          created_at: new Date().toISOString(),
        },
        ...items,
      ].slice(0, 10));
    } catch (err) {
      setFormError(err.message);
    } finally {
      const elapsed = Date.now() - startedAt;
      const minBridgeMs = 1200;
      if (elapsed < minBridgeMs) {
        await new Promise((resolve) => setTimeout(resolve, minBridgeMs - elapsed));
      }
      setLoading(false);
    }
  }

  async function handleAddCurrentToWatchlist() {
    if (!normalizedSymbol) {
      setFormError('请输入股票代码后再保存。');
      return;
    }
    try {
      const response = await addWatchlist(normalizedSymbol);
      if (response.success) setWatchlist(response.data);
    } catch (err) {
      setFormError(err.message || '保存股票失败。');
    }
  }

  async function handleRemoveWatchlist(symbolToRemove) {
    try {
      const response = await removeWatchlist(symbolToRemove);
      if (response.success) setWatchlist(response.data);
    } catch (err) {
      setFormError(err.message || '删除股票失败。');
    }
  }

  async function handleQuickAnalyze(symbolToAnalyze) {
    setSymbol(symbolToAnalyze);
    setFormError('');
    await runAnalyze(symbolToAnalyze);
  }

  async function handleBatchAnalyze() {
    setBatchNotice('');
    const symbols = [...new Set(
      batchInput
        .split(/[\s,，;；]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    )];

    if (!symbols.length) {
      setBatchNotice('请输入至少一个股票代码。');
      return;
    }

    setBatchLoading(true);
    try {
      const response = await analyzeStocksBatch(symbols);
      const rows = response.data || [];
      const successRows = rows.filter((row) => row.success);
      const failRows = rows.filter((row) => !row.success);

      if (successRows.length > 0) {
        const first = successRows[0];
        setResult({
          symbol: first.symbol,
          stock_data: first.stock_data,
          analysis: first.analysis,
        });
        setAnalyzedSymbol(first.symbol);
        setHistory((items) => [
          ...successRows.map((row, index) => ({
            id: `${row.symbol}-${Date.now()}-${index}`,
            symbol: row.symbol,
            company_name: row.stock_data?.companyName || row.symbol,
            summary: row.analysis.summary,
            sentiment: row.analysis.sentiment,
            risk_level: row.analysis.risk_level,
            created_at: new Date().toISOString(),
          })),
          ...items,
        ].slice(0, 10));
      }

      setBatchNotice(`批量完成：成功 ${successRows.length}，失败 ${failRows.length}。`);
    } catch (err) {
      setBatchNotice(err.message || '批量分析失败。');
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleWatchlistBatchAnalyze() {
    setBatchNotice('');
    if (!watchlist.length) {
      setBatchNotice('股票池为空，请先保存股票代码。');
      return;
    }

    setBatchLoading(true);
    try {
      const response = await analyzeStocksBatch(watchlist);
      const rows = response.data || [];
      const successRows = rows.filter((row) => row.success);
      const failRows = rows.filter((row) => !row.success);

      if (successRows.length > 0) {
        const first = successRows[0];
        setResult({
          symbol: first.symbol,
          stock_data: first.stock_data,
          analysis: first.analysis,
        });
        setAnalyzedSymbol(first.symbol);
        setHistory((items) => [
          ...successRows.map((row, index) => ({
            id: `${row.symbol}-${Date.now()}-${index}`,
            symbol: row.symbol,
            company_name: row.stock_data?.companyName || row.symbol,
            summary: row.analysis.summary,
            sentiment: row.analysis.sentiment,
            risk_level: row.analysis.risk_level,
            created_at: new Date().toISOString(),
          })),
          ...items,
        ].slice(0, 10));
      }

      setBatchNotice(`股票池查询完成：成功 ${successRows.length}，失败 ${failRows.length}。`);
    } catch (err) {
      setBatchNotice(err.message || '股票池批量查询失败。');
    } finally {
      setBatchLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">AI 股票分析</p>
          <h1 aria-label={heroTitle}>
            <span className="hero-title-chars" aria-hidden="true">
              {heroTitle.split('').map((char, index) => (
                <span className="hero-char" key={`${char}-${index}`} style={{ '--char-index': index }}>
                  {char}
                </span>
              ))}
            </span>
          </h1>
          <p className="hero-copy">
            输入美股代码，查看实时行情、模型情绪判断、风险等级与最近分析记录。
          </p>
        </div>

        <form className="search-card" onSubmit={handleSubmit}>
          <label htmlFor="symbol">股票代码</label>
          <div className="search-row">
            <input
              id="symbol"
              value={symbol}
              maxLength={16}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              placeholder="AAPL / 600519.SS"
              aria-describedby={formError ? 'form-error' : undefined}
            />
            <button type="submit" disabled={loading}>
              {loading ? '分析中' : '开始分析'}
            </button>
          </div>
          {formError && <p id="form-error" className="error">{formError}</p>}
        </form>
      </section>

      <section className="ops-grid">
        <article className="panel ops-card">
          <div className="section-heading">
            <p className="eyebrow">批量查询</p>
            <span>最多 10 个</span>
          </div>
          <textarea
            className="batch-input"
            value={batchInput}
            onChange={(event) => setBatchInput(event.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, 600519.SS"
          />
          <div className="ops-actions">
            <button type="button" onClick={handleBatchAnalyze} disabled={batchLoading || loading}>
              {batchLoading ? '批量分析中' : '批量分析'}
            </button>
            {batchNotice && <p className="hint">{batchNotice}</p>}
          </div>
        </article>

        <article className="panel ops-card">
          <div className="section-heading">
            <p className="eyebrow">我的股票池</p>
            <span>{watchlist.length} 只</span>
          </div>
          <div className="ops-actions">
            <button type="button" onClick={handleAddCurrentToWatchlist} disabled={loading}>
              保存当前代码
            </button>
            <button type="button" onClick={handleWatchlistBatchAnalyze} disabled={batchLoading || loading || !watchlist.length}>
              {batchLoading ? '查询中' : '一键查询股票池'}
            </button>
          </div>
          <div className="watchlist-wrap">
            {watchlistLoading ? (
              <p className="hint">加载中...</p>
            ) : watchlist.length === 0 ? (
              <p className="hint">还没有保存股票，先输入代码后点击“保存当前代码”。</p>
            ) : (
              watchlist.map((item) => (
                <div className="watch-item" key={item}>
                  <strong>{item}</strong>
                  <div>
                    <button type="button" className="mini-btn" onClick={() => handleQuickAnalyze(item)}>查询</button>
                    <button type="button" className="mini-btn ghost" onClick={() => handleRemoveWatchlist(item)}>删除</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {loading && (
        <div className="bridge-overlay" role="status" aria-live="polite">
          <div className="bridge-card panel">
            <p className="eyebrow">分析进行中</p>
            <h2>正在处理 {normalizedSymbol || '股票代码'}，请稍候。</h2>
            <p className="bridge-copy">系统会先拉取行情，再做结构化分析并返回结果。</p>
            <div className="bridge-steps">
              {bridgeSteps.map((step, index) => (
                <div className={`bridge-step ${index <= bridgeStepIndex ? 'active' : ''}`} key={step}>
                  <span className="bridge-dot" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="view-switch panel" aria-label="页面视图切换">
        <button
          type="button"
          className={`switch-btn ${activeView === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveView('analysis')}
        >
          分析页
        </button>
        <button
          type="button"
          className={`switch-btn ${activeView === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveView('visual')}
        >
          可视化页
        </button>
      </section>

      {activeView === 'analysis' ? (
        <section className="grid">
          <article className="result panel">
            <div className="section-heading">
              <p className="eyebrow">本次结果</p>
              <span>{result ? result.symbol : '等待分析'}</span>
            </div>

            {result ? (
              <>
                <p className="company-name">
                  {(result.company_name || result.stock_data?.companyName || result.symbol)} ({result.symbol})
                </p>
                <div className="quote-line">
                  <strong>${Number(result.stock_data.price || 0).toFixed(2)}</strong>
                  <span className={(result.stock_data.changePercent || 0) >= 0 ? 'positive' : 'negative'}>
                    {(result.stock_data.changePercent || 0) >= 0 ? '+' : ''}{result.stock_data.changePercent}%
                  </span>
                </div>

                <div className="metrics">
                  <div>
                    <span>涨跌额</span>
                    <strong>{(result.stock_data.change || 0) >= 0 ? '+' : ''}{result.stock_data.change}</strong>
                  </div>
                  <div>
                    <span>成交量</span>
                    <strong>{formatNumber(result.stock_data.volume)}</strong>
                  </div>
                  <div>
                    <span>交易日</span>
                    <strong>{result.stock_data.latestTradingDay}</strong>
                  </div>
                </div>

                <div className="analysis-box">
                  <div>
                    <span className="pill">{sentimentLabelMap[result.analysis.sentiment] || result.analysis.sentiment}</span>
                    <span className="pill soft">{riskLabelMap[result.analysis.risk_level] || result.analysis.risk_level}风险</span>
                  </div>
                  <p>{result.analysis.summary}</p>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <strong>暂未分析</strong>
                <p>输入并提交股票代码后，这里会显示行情数据和 AI 分析结果。</p>
              </div>
            )}
          </article>

          <article className="history panel">
            <div className="section-heading">
              <p className="eyebrow">最近记录</p>
              <span>{history.length} 条</span>
            </div>

            <div className="history-list">
              {historyLoading ? (
                <div className="history-empty">
                  <strong>记录加载中</strong>
                  <p>正在读取最近分析记录。</p>
                </div>
              ) : history.length === 0 ? (
                <div className="history-empty">
                  <strong>暂无历史记录</strong>
                  <p>完成一次分析后，这里会自动展示最近 10 条记录。</p>
                </div>
              ) : (
                history.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div>
                      <strong>{item.company_name || item.symbol}</strong>
                      {(item.company_name && item.company_name !== item.symbol) && <span className="ticker-code">{item.symbol}</span>}
                      <p>{item.summary}</p>
                    </div>
                    <div className="history-meta">
                      <span>{sentimentLabelMap[item.sentiment] || item.sentiment}</span>
                      <span>{riskLabelMap[item.risk_level] || item.risk_level}风险</span>
                      <time>{formatDate(item.created_at)}</time>
                    </div>
                  </div>
                ))
              )}
              {historyNotice && <p className="hint">{historyNotice}</p>}
            </div>
          </article>
        </section>
      ) : (
        <section className="viz-layout">
          <article className="panel viz-overview">
            <div className="section-heading">
              <p className="eyebrow">统计概览</p>
              <span>样本 {overviewStats.sampleSize} 条</span>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <span>最新分析股票</span>
                <strong>{overviewStats.latestSymbol}</strong>
              </div>
              <div className="stat-card">
                <span>看涨占比</span>
                <strong>{overviewStats.bullishRatio}%</strong>
              </div>
              <div className="stat-card">
                <span>高风险占比</span>
                <strong>{overviewStats.highRiskRatio}%</strong>
              </div>
              <div className="stat-card">
                <span>平均风险分</span>
                <strong>{overviewStats.avgRisk}</strong>
              </div>
            </div>
          </article>

          <article className="panel viz-panel">
            <div className="section-heading">
              <p className="eyebrow">单股历史走势</p>
              <span>{seriesCompanyName || analyzedSymbol || '-'} · {seriesPeriod}</span>
            </div>
            <div className="period-switch" role="tablist" aria-label="历史周期切换">
              {periodOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`period-btn ${seriesPeriod === option ? 'active' : ''}`}
                  disabled={!canLoadSeries}
                  onClick={() => setSeriesPeriod(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {!canLoadSeries ? (
              <div className="history-empty">
                <strong>请先执行分析</strong>
                <p>先在分析页点击“开始分析”，再查看该股票历史走势。</p>
              </div>
            ) : seriesLoading ? (
              <div className="history-empty">
                <strong>加载走势中</strong>
                <p>正在拉取 {analyzedSymbol} 的历史行情。</p>
              </div>
            ) : series.length === 0 ? (
              <div className="history-empty">
                <strong>暂无历史行情</strong>
                <p>{seriesNotice || '当前周期没有可展示的数据。'}</p>
              </div>
            ) : (
              <div className="line-chart-wrap">
                <svg
                  className="line-chart"
                  viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                  role="img"
                  aria-label={`${normalizedSymbol || 'AAPL'} 历史收盘价折线图`}
                >
                  <path d={chartGeometry.areaPath} className="chart-area" />
                  <path d={chartGeometry.linePath} className="chart-line" />
                  {chartGeometry.points.map((point, idx) => (
                    <circle key={`point-${idx}`} cx={point.x} cy={point.y} r="2.5" className="chart-point" />
                  ))}
                </svg>
                <div className="chart-axis">
                  <span>最低 ${chartGeometry.minClose.toFixed(2)}</span>
                  <span>最高 ${chartGeometry.maxClose.toFixed(2)}</span>
                </div>
              </div>
            )}
            {seriesNotice && !series.length && <p className="hint">{seriesNotice}</p>}
          </article>

          <article className="panel viz-panel">
            <div className="section-heading">
              <p className="eyebrow">情绪分布</p>
              <span>{sampleSize} 条记录</span>
            </div>
            <div className="bars">
              {sentimentMetrics.map((item) => (
                <div className="bar-row" key={item.key}>
                  <label>{item.label}</label>
                  <div className="bar-track">
                    <div className="bar-fill sentiment" style={{ width: `${item.percent}%` }} />
                  </div>
                  <strong>{item.count} / {item.percent}%</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel viz-panel">
            <div className="section-heading">
              <p className="eyebrow">风险分布</p>
              <span>{sampleSize} 条记录</span>
            </div>
            <div className="bars">
              {riskMetrics.map((item) => (
                <div className="bar-row" key={item.key}>
                  <label>{item.label}风险</label>
                  <div className="bar-track">
                    <div className="bar-fill risk" style={{ width: `${item.percent}%` }} />
                  </div>
                  <strong>{item.count} / {item.percent}%</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel viz-timeline">
            <div className="section-heading">
              <p className="eyebrow">最近分析时间线</p>
              <span>按时间倒序</span>
            </div>
            {history.length === 0 ? (
              <div className="history-empty">
                <strong>暂无可视化样本</strong>
                <p>先在分析页执行至少一次分析。</p>
              </div>
            ) : (
              <div className="timeline">
                {history.map((item) => (
                  <div className="timeline-item" key={`timeline-${item.id}`}>
                    <span className="dot" />
                    <div>
                      <p><strong>{item.symbol}</strong> · {sentimentLabelMap[item.sentiment] || item.sentiment} · {riskLabelMap[item.risk_level] || item.risk_level}风险</p>
                      <time>{formatDate(item.created_at)}</time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default App;
