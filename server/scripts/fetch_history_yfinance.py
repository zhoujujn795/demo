import json
import sys

import yfinance as yf


def _to_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except Exception:
        return None


def _to_int(value):
    try:
        if value is None:
            return None
        return int(value)
    except Exception:
        return None


def fetch_series(symbol: str, period: str):
    ticker = yf.Ticker(symbol)
    company_name = symbol
    try:
        info = ticker.get_info() or {}
        company_name = info.get("shortName") or info.get("longName") or symbol
    except Exception:
        company_name = symbol

    hist = ticker.history(period=period, interval="1d", auto_adjust=False)
    if hist is None or hist.empty:
        raise RuntimeError("No history data returned")

    series = []
    for idx, row in hist.iterrows():
        date_str = idx.date().isoformat() if hasattr(idx, "date") else str(idx)[:10]
        close = _to_float(row.get("Close"))
        if close is None:
            continue
        series.append(
            {
                "date": date_str,
                "close": close,
                "volume": _to_int(row.get("Volume")),
            }
        )
    return {"companyName": company_name, "series": series}


def main():
    if len(sys.argv) < 2 or not str(sys.argv[1]).strip():
        raise RuntimeError("symbol argument is required")

    symbol = str(sys.argv[1]).strip().upper()
    period = str(sys.argv[2]).strip() if len(sys.argv) > 2 else "1mo"
    allowed = {"5d", "1mo", "3mo", "6mo", "1y"}
    if period not in allowed:
        raise RuntimeError("period is invalid")

    payload = fetch_series(symbol, period)
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
