import pandas as pd
import numpy as np
import uuid
from pathlib import Path

from models.schemas import (
    BacktestRequest,
    BacktestResponse,
    MetricsResponse,
    EquityPoint,
    TradeRecord,
    StrategyType,
    CompareRequest,
    CompareResponse,
)

DATA_DIR = Path(__file__).parent.parent / "data"

STRATEGY_CONFIG = {
    StrategyType.momentum: {
        "signal_col": "Momentum_score",
        "is_binary": False,
        "name": "Momentum Only",
    },
    StrategyType.sentiment: {
        "signal_col": "Sentiment_score",
        "is_binary": False,
        "name": "Sentiment Only",
    },
    StrategyType.hybrid_ml: {
        "signal_col": "BUY",
        "is_binary": True,
        "name": "Hybrid ML",
    },
}


def load_and_merge(
    fused_path: Path,
    price_path: Path,
) -> pd.DataFrame:
    fused = pd.read_csv(fused_path, parse_dates=["date"])
    fused.rename(
        columns={
            "roc": "ROC",
            "rsi": "RSI",
            "ma_ratio": "MA_ratio",
            "volatility": "Volatility",
            "momentum_score": "Momentum_score",
            "sentiment_score": "Sentiment_score",
            "buy": "BUY",
        },
        inplace=True,
    )

    price = pd.read_csv(price_path, parse_dates=["date"], dayfirst=True)
    for col in ["open", "high", "low", "close"]:
        if col in price.columns:
            price[col] = (
                price[col]
                .astype(str)
                .str.replace(",", "", regex=False)
                .astype(float)
            )

    price = price[["date", "stock", "open", "close"]].copy()
    price = price.sort_values(["stock", "date"]).reset_index(drop=True)

    df = fused.merge(price, on=["date", "stock"], how="left")
    df = df.sort_values(["date", "stock"]).reset_index(drop=True)
    return df


def split_data(df: pd.DataFrame, train_pct: float = 0.70):
    dates = sorted(df["date"].unique())
    split_idx = int(len(dates) * train_pct)
    split_date = dates[split_idx]
    train = df[df["date"] < split_date].copy()
    test = df[df["date"] >= split_date].copy()
    return train, test, split_date


def generate_signals(df: pd.DataFrame, signal_col: str, threshold: float, is_binary: bool) -> pd.DataFrame:
    df = df.copy()
    if is_binary:
        df["signal"] = df[signal_col].fillna(0).astype(int)
    else:
        df["signal"] = (df[signal_col].fillna(0) > threshold).astype(int)
    return df


def compute_metrics(equity_series: pd.Series, trades_df: pd.DataFrame, initial_capital: float) -> dict:
    if len(equity_series) < 2:
        return {}

    daily_returns = equity_series.pct_change().dropna()
    end_val = equity_series.iloc[-1]
    n_days = (equity_series.index[-1] - equity_series.index[0]).days
    n_years = max(n_days / 365.25, 0.01)

    cagr = (end_val / initial_capital) ** (1 / n_years) - 1
    sharpe = (
        (daily_returns.mean() / daily_returns.std()) * np.sqrt(252)
        if daily_returns.std() > 0
        else 0.0
    )
    rolling_max = equity_series.cummax()
    max_drawdown = ((equity_series - rolling_max) / rolling_max).min()

    total_trades = len(trades_df)
    win_pct = trades_df["win"].mean() * 100 if total_trades > 0 else 0.0
    total_pnl = trades_df["pnl"].sum() if total_trades > 0 else 0.0

    return {
        "CAGR": round(cagr * 100, 2),
        "Sharpe": round(float(sharpe), 3),
        "Max_Drawdown": round(float(max_drawdown * 100), 2),
        "Win_Pct": round(win_pct, 1),
        "Total_Trades": total_trades,
        "Total_PnL": round(float(total_pnl), 2),
        "Final_Capital": round(float(end_val), 2),
        "Initial_Capital": round(initial_capital, 2),
    }


def run_backtest_core(
    df: pd.DataFrame,
    signal_col: str,
    threshold: float,
    is_binary: bool,
    initial_capital: float,
    transaction_cost: float,
    hold_days: int,
    position_size_pct: float,
    strategy_name: str,
) -> dict:
    df = generate_signals(df, signal_col, threshold, is_binary)
    df = df.sort_values(["date", "stock"]).reset_index(drop=True)

    df_valid = df.dropna(subset=["open", "close"])
    price_lookup = (
        df_valid.set_index(["date", "stock"])[["open", "close"]].to_dict("index")
    )

    trading_dates = sorted(df["date"].unique())
    date_index = {d: i for i, d in enumerate(trading_dates)}

    cash = float(initial_capital)
    positions = {}
    closed_trades = []
    equity_curve = {}

    for i, today in enumerate(trading_dates):
        to_remove = []
        for pos_key, exit_date in positions.items():
            entry_date, stock, entry_price, shares = pos_key
            if today >= exit_date:
                prices = price_lookup.get((today, stock), {})
                exit_price = prices.get("close", entry_price)

                proceeds = shares * exit_price * (1 - transaction_cost)
                cost_basis = shares * entry_price * (1 + transaction_cost)
                trade_pnl = proceeds - cost_basis
                trade_ret = trade_pnl / cost_basis

                cash += proceeds
                closed_trades.append(
                    {
                        "entry_date": str(entry_date.date()) if hasattr(entry_date, "date") else str(entry_date),
                        "exit_date": str(today.date()) if hasattr(today, "date") else str(today),
                        "stock": stock,
                        "entry_price": round(float(entry_price), 2),
                        "exit_price": round(float(exit_price), 2),
                        "shares": round(shares, 4),
                        "pnl": round(trade_pnl, 2),
                        "return_pct": round(trade_ret * 100, 3),
                        "win": int(trade_pnl > 0),
                    }
                )
                to_remove.append(pos_key)

        for k in to_remove:
            del positions[k]

        if i + 1 < len(trading_dates):
            tomorrow = trading_dates[i + 1]
            today_signals = df[(df["date"] == today) & (df["signal"] == 1)]["stock"].tolist()

            for stock in today_signals:
                if any(pk[1] == stock for pk in positions):
                    continue

                prices = price_lookup.get((tomorrow, stock), {})
                entry_price = prices.get("open", None)

                if entry_price is None or entry_price <= 0:
                    continue

                alloc = cash * position_size_pct
                if alloc < 100:
                    continue

                cost_per_share = entry_price * (1 + transaction_cost)
                shares = alloc / cost_per_share
                total_cost = shares * cost_per_share

                if total_cost > cash:
                    continue

                cash -= total_cost
                entry_idx = date_index.get(tomorrow, i + 1)
                exit_idx = min(entry_idx + hold_days, len(trading_dates) - 1)
                exit_date = trading_dates[exit_idx]
                positions[(tomorrow, stock, entry_price, shares)] = exit_date

        open_value = sum(
            price_lookup.get((today, pk[1]), {}).get("close", pk[2]) * pk[3]
            for pk in positions
        )
        equity_curve[today] = cash + open_value

    last_date = trading_dates[-1]
    for pos_key in list(positions.keys()):
        entry_date, stock, entry_price, shares = pos_key
        prices = price_lookup.get((last_date, stock), {})
        exit_price = prices.get("close", entry_price)
        proceeds = shares * exit_price * (1 - transaction_cost)
        cost_basis = shares * entry_price * (1 + transaction_cost)
        trade_pnl = proceeds - cost_basis
        trade_ret = trade_pnl / cost_basis
        cash += proceeds
        closed_trades.append(
            {
                "entry_date": str(entry_date.date()) if hasattr(entry_date, "date") else str(entry_date),
                "exit_date": str(last_date.date()) if hasattr(last_date, "date") else str(last_date),
                "stock": stock,
                "entry_price": round(float(entry_price), 2),
                "exit_price": round(float(exit_price), 2),
                "shares": round(shares, 4),
                "pnl": round(trade_pnl, 2),
                "return_pct": round(trade_ret * 100, 3),
                "win": int(trade_pnl > 0),
            }
        )

    equity_series = pd.Series(equity_curve).sort_index()
    trades_df = pd.DataFrame(closed_trades) if closed_trades else pd.DataFrame()
    metrics = compute_metrics(equity_series, trades_df, initial_capital)

    rolling_max = equity_series.cummax()
    drawdown_series = ((equity_series - rolling_max) / rolling_max * 100)

    equity_points = [
        {"date": str(d.date()) if hasattr(d, "date") else str(d), "value": round(float(v), 2)}
        for d, v in equity_series.items()
    ]
    drawdown_points = [
        {"date": str(d.date()) if hasattr(d, "date") else str(d), "value": round(float(v), 4)}
        for d, v in drawdown_series.items()
    ]
    trades_list = trades_df.to_dict("records") if not trades_df.empty else []

    return {
        "strategy_name": strategy_name,
        "metrics": metrics,
        "equity_curve": equity_points,
        "drawdown": drawdown_points,
        "trades": trades_list,
        "run_id": str(uuid.uuid4()),
    }


def execute_backtest(request: BacktestRequest) -> dict:
    fused_path = DATA_DIR / "fused_dataset.csv"
    price_path = DATA_DIR / "Nifty50_Master_Cleaned_Full.csv"

    if not fused_path.exists():
        raise FileNotFoundError(f"Fused dataset not found: {fused_path}")
    if not price_path.exists():
        raise FileNotFoundError(f"Price master not found: {price_path}")

    df = load_and_merge(fused_path, price_path)
    _, test_df, _ = split_data(df, request.train_pct)

    config = STRATEGY_CONFIG[request.strategy]
    threshold = (
        request.momentum_threshold
        if request.strategy == StrategyType.momentum
        else request.sentiment_threshold
        if request.strategy == StrategyType.sentiment
        else 0.0
    )

    result = run_backtest_core(
        df=test_df,
        signal_col=config["signal_col"],
        threshold=threshold,
        is_binary=config["is_binary"],
        initial_capital=request.initial_capital,
        transaction_cost=request.transaction_cost,
        hold_days=request.hold_days,
        position_size_pct=request.position_size_pct,
        strategy_name=config["name"],
    )
    return result


def execute_compare(request: CompareRequest) -> dict:
    fused_path = DATA_DIR / "fused_dataset.csv"
    price_path = DATA_DIR / "Nifty50_Master_Cleaned_Full.csv"

    df = load_and_merge(fused_path, price_path)
    _, test_df, _ = split_data(df, request.train_pct)

    results = {}
    for strategy in request.strategies:
        config = STRATEGY_CONFIG[strategy]
        threshold = (
            request.momentum_threshold
            if strategy == StrategyType.momentum
            else request.sentiment_threshold
            if strategy == StrategyType.sentiment
            else 0.0
        )
        result = run_backtest_core(
            df=test_df,
            signal_col=config["signal_col"],
            threshold=threshold,
            is_binary=config["is_binary"],
            initial_capital=request.initial_capital,
            transaction_cost=request.transaction_cost,
            hold_days=request.hold_days,
            position_size_pct=request.position_size_pct,
            strategy_name=config["name"],
        )
        results[config["name"]] = result

    comparison_table = []
    for name, res in results.items():
        m = res["metrics"]
        comparison_table.append(
            {
                "Strategy": name,
                "CAGR (%)": m.get("CAGR", 0),
                "Sharpe": m.get("Sharpe", 0),
                "Max DD (%)": m.get("Max_Drawdown", 0),
                "Win %": m.get("Win_Pct", 0),
                "Trades": m.get("Total_Trades", 0),
                "Final Capital": m.get("Final_Capital", 0),
            }
        )

    return {"results": results, "comparison_table": comparison_table}