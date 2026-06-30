from fastapi import APIRouter, HTTPException, Query
from services.sentiment_service import fetch_live_sentiment

router = APIRouter(prefix="/sentiment", tags=["sentiment"])

@router.get("/live")
async def get_live_sentiment(
    stock: str = Query(..., description="Stock symbol e.g. RELIANCE, TCS, INFY"),
    days_back: int = Query(3, ge=1, le=7, description="How many days of news to analyze"),
):
    try:
        result = fetch_live_sentiment(stock, days_back)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment fetch failed: {str(e)}")
