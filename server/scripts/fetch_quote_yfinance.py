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


def fetch_quote(symbol: str):
    ticker = yf.Ticker(symbol)
    company_name = symbol
    try:
        info = ticker.get_info() or {}
        company_name = info.get("shortName") or info.get("longName") or symbol
    except Exception:
        company_name = symbol

    hist = ticker.history(period="5d", interval="1d", auto_adjust=False)
    if hist is None or hist.empty:
        raise RuntimeError("No price history returned")

    latest = hist.iloc[-1]
    previous = hist.iloc[-2] if len(hist) > 1 else hist.iloc[-1]

    close_price = _to_float(latest.get("Close"))
    previous_close = _to_float(previous.get("Close"))
    change = None
    change_percent = None
    if close_price is not None and previous_close not in (None, 0):
        change = close_price - previous_close
        change_percent = (change / previous_close) * 100.0

    latest_index = hist.index[-1]
    latest_day = latest_index.date().isoformat() if hasattr(latest_index, "date") else str(latest_index)[:10]

    return {
        "companyName": company_name,
        "price": close_price,
        "change": change,
        "changePercent": change_percent,
        "volume": _to_int(latest.get("Volume")),
        "latestTradingDay": latest_day,
    }


def main():
    if len(sys.argv) < 2 or not str(sys.argv[1]).strip():
        raise RuntimeError("symbol argument is required")

    symbol = str(sys.argv[1]).strip().upper()
    quote = fetch_quote(symbol)
    print(json.dumps(quote, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
