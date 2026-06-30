from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.schemas import BacktestRequest, BacktestResponse, CompareRequest, CompareResponse
from services.backtest_service import execute_backtest, execute_compare
from database import get_db
from models.backtest_run import BacktestRun

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.post("/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest, db: Session = Depends(get_db)):
    try:
        result = execute_backtest(request)
        m = result["metrics"]
        db_run = BacktestRun(
            strategy=request.strategy,
            initial_capital=request.initial_capital,
            hold_days=request.hold_days,
            position_size_pct=request.position_size_pct,
            transaction_cost=request.transaction_cost,
            train_pct=request.train_pct,
            momentum_threshold=request.momentum_threshold,
            sentiment_threshold=request.sentiment_threshold,
            cagr=m.get("CAGR"),
            sharpe_ratio=m.get("Sharpe"),
            max_drawdown=m.get("Max_Drawdown"),
            win_rate=m.get("Win_Pct"),
            total_trades=m.get("Total_Trades"),
            total_pnl=m.get("Total_PnL"),
            final_capital=m.get("Final_Capital"),
        )
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing column in dataset: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@router.post("/compare", response_model=CompareResponse)
async def compare_strategies(request: CompareRequest):
    if not request.strategies:
        raise HTTPException(status_code=422, detail="At least one strategy required")
    try:
        result = execute_compare(request)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/strategies")
async def list_strategies():
    return {
        "strategies": [
            {"id": "momentum", "name": "Momentum Only", "description": "Trades based on Momentum_score threshold"},
            {"id": "sentiment", "name": "Sentiment Only", "description": "Trades based on Sentiment_score threshold"},
            {"id": "hybrid_ml", "name": "Hybrid ML", "description": "Logistic Regression ML signal (BUY column)"},
        ]
    }

@router.get("/history")
async def get_history(db: Session = Depends(get_db), limit: int = 20):
    runs = db.query(BacktestRun).order_by(BacktestRun.created_at.desc()).limit(limit).all()
    return {
        "runs": [
            {
                "id": r.id,
                "strategy": r.strategy,
                "initial_capital": r.initial_capital,
                "hold_days": r.hold_days,
                "cagr": r.cagr,
                "sharpe_ratio": r.sharpe_ratio,
                "max_drawdown": r.max_drawdown,
                "win_rate": r.win_rate,
                "total_trades": r.total_trades,
                "total_pnl": r.total_pnl,
                "final_capital": r.final_capital,
                "created_at": str(r.created_at),
            }
            for r in runs
        ]
    }
