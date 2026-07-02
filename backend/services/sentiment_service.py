import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_API_URL = "https://newsapi.org/v2/everything"

analyzer = SentimentIntensityAnalyzer()

STOCK_NAME_MAP = {
    "RELIANCE": "Reliance Industries",
    "TCS": "Tata Consultancy Services",
    "HDFCBANK": "HDFC Bank",
    "INFY": "Infosys",
    "ICICIBANK": "ICICI Bank",
    "HINDUNILVR": "Hindustan Unilever",
    "ITC": "ITC Limited",
    "SBIN": "State Bank of India",
    "BHARTIARTL": "Bharti Airtel",
    "KOTAKBANK": "Kotak Mahindra Bank",
    "LT": "Larsen & Toubro",
    "AXISBANK": "Axis Bank",
    "ASIANPAINT": "Asian Paints",
    "MARUTI": "Maruti Suzuki",
    "SUNPHARMA": "Sun Pharmaceutical",
    "TITAN": "Titan Company",
    "BAJFINANCE": "Bajaj Finance",
    "WIPRO": "Wipro",
    "ULTRACEMCO": "UltraTech Cement",
    "HCLTECH": "HCL Technologies",
    "NESTLEIND": "Nestle India",
    "TECHM": "Tech Mahindra",
    "POWERGRID": "Power Grid Corporation",
    "NTPC": "NTPC Limited",
    "ONGC": "Oil and Natural Gas Corporation",
    "JSWSTEEL": "JSW Steel",
    "TATASTEEL": "Tata Steel",
    "ADANIENT": "Adani Enterprises",
    "ADANIPORTS": "Adani Ports",
    "BAJAJFINSV": "Bajaj Finserv",
    "BPCL": "Bharat Petroleum",
    "BRITANNIA": "Britannia Industries",
    "CIPLA": "Cipla",
    "COALINDIA": "Coal India",
    "DIVISLAB": "Divi's Laboratories",
    "DRREDDY": "Dr Reddy's Laboratories",
    "EICHERMOT": "Eicher Motors",
    "GRASIM": "Grasim Industries",
    "HDFCLIFE": "HDFC Life Insurance",
    "HEROMOTOCO": "Hero MotoCorp",
    "HINDALCO": "Hindalco Industries",
    "INDUSINDBK": "IndusInd Bank",
    "LTIM": "LTIMindtree",
    "MM": "Mahindra & Mahindra",
    "SBILIFE": "SBI Life Insurance",
    "SHRIRAMFIN": "Shriram Finance",
    "TATACONSUM": "Tata Consumer Products",
    "TATAMOTORS": "Tata Motors",
    "TRENT": "Trent Limited",
    "VEDL": "Vedanta",
}

# Restrict to Indian financial news domains to improve relevance.
# NewsAPI free tier has weak Indian business news coverage by default,
# so unrestricted queries return generic global news matching the company
# name loosely. Domain filtering significantly improves signal quality.
FINANCIAL_DOMAINS = ",".join([
    "economictimes.indiatimes.com",
    "moneycontrol.com",
    "business-standard.com",
    "livemint.com",
    "thehindubusinessline.com",
    "financialexpress.com",
    "ndtv.com",
    "reuters.com",
    "bloomberg.com",
])

def fetch_live_sentiment(stock_symbol: str, days_back: int = 3) -> dict:
    if not NEWS_API_KEY:
        raise ValueError("NEWS_API_KEY not configured. Add it to backend/.env")

    query_name = STOCK_NAME_MAP.get(stock_symbol.upper(), stock_symbol)
    quote_char = chr(34)
    exact_query = quote_char + query_name + quote_char
    from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

    params = {
        "q": exact_query,
        "from": from_date,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": 20,
        "domains": FINANCIAL_DOMAINS,
        "apiKey": NEWS_API_KEY,
    }

    response = requests.get(NEWS_API_URL, params=params, timeout=10)

    if response.status_code == 426:
        raise ValueError("NewsAPI free tier does not support this date range. Try fewer days_back.")
    if response.status_code == 429:
        raise ValueError("NewsAPI daily request limit reached. Try again tomorrow.")
    if response.status_code != 200:
        raise ValueError(f"NewsAPI error: {response.status_code} - {response.text}")

    data = response.json()
    articles = data.get("articles", [])

    # Fallback: if domain-restricted search returns nothing (common for
    # smaller-cap stocks with low financial press coverage), retry without
    # domain restriction so the feature still returns a usable result.
    if not articles:
        fallback_params = dict(params)
        fallback_params.pop("domains", None)
        fallback_response = requests.get(NEWS_API_URL, params=fallback_params, timeout=10)
        if fallback_response.status_code == 200:
            articles = fallback_response.json().get("articles", [])

    if not articles:
        return {
            "stock": stock_symbol,
            "query_used": query_name,
            "article_count": 0,
            "average_sentiment": 0.0,
            "sentiment_label": "neutral",
            "articles": [],
        }

    scored_articles = []
    total_compound = 0.0

    for article in articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        text = f"{title}. {description}"

        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]
        total_compound += compound

        scored_articles.append({
            "title": title,
            "source": article.get("source", {}).get("name", "Unknown"),
            "published_at": article.get("publishedAt"),
            "url": article.get("url"),
            "sentiment_score": round(compound, 4),
        })

    average_sentiment = round(total_compound / len(articles), 4)

    if average_sentiment >= 0.05:
        label = "positive"
    elif average_sentiment <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "stock": stock_symbol,
        "query_used": query_name,
        "article_count": len(articles),
        "average_sentiment": average_sentiment,
        "sentiment_label": label,
        "articles": scored_articles,
    }