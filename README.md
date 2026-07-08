# AlphaBacktest

A full-stack quantitative backtesting platform for Nifty 50 equities, combining momentum indicators, live news sentiment analysis, and a hybrid ML strategy — with a FastAPI backend, React/Vite frontend, and persistent run history.

**Live demo:** [alphabacktest.vercel.app](https://alphabacktest.vercel.app)
**API:** [alphabacktest-api.onrender.com](https://alphabacktest-api.onrender.com/docs)

> Note: the backend runs on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the instance wakes up.

---

## Features

- **Three trading strategies** — Momentum (technical indicators), Sentiment (news-driven), and Hybrid ML (logistic regression signal), each independently backtestable and configurable
- **Live market sentiment** — real-time news sentiment scoring for any of the Nifty 50 stocks, using VADER sentiment analysis over financial-news-domain-filtered articles from NewsAPI
- **Strategy comparison** — run multiple strategies side by side against the same test window and compare CAGR, Sharpe ratio, max drawdown, and win rate
- **Historical run tracking** — every backtest is persisted to a database, with a dedicated history view to review past runs
- **Interactive equity curve and drawdown visualization** — built with Recharts

## Tech Stack

**Backend**
- FastAPI (Python) with async lifespan management
- SQLAlchemy + SQLite for run persistence
- pandas / numpy for data processing and backtest simulation
- VADER (`vaderSentiment`) for sentiment scoring
- NewsAPI for live financial news retrieval

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Recharts for equity/drawdown charts
- Axios for API communication

**Infrastructure**
- Backend deployed on Render (Docker)
- Frontend deployed on Vercel
- Dockerized local development via `docker-compose`

## Architecture
```bash
┌──────────────┐        HTTPS        ┌──────────────┐
│   Frontend   │ ──────────────────▶ │   Backend    │
│  (Vercel)    │ ◀────────────────── │  (Render)    │
│  React+Vite  │        JSON         │   FastAPI    │
└──────────────┘                     └──────┬───────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
              ┌───────────┐          ┌──────────────┐          ┌────────────┐
              │  SQLite   │          │   NewsAPI     │          │  CSV Data  │
              │ (history) │          │ (live news)   │          │ (backtest) │
              └───────────┘          └──────────────┘          └────────────┘
```
## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A free [NewsAPI.org](https://newsapi.org) API key (for the live sentiment feature)

### Local setup

**1. Clone the repo**
```bash
git clone https://github.com/zuhamsid26/alphabacktest.git
cd alphabacktest
```

**2. Backend**
```bash
cd backend
pip install -r ../requirements.txt
cp .env.example .env
# edit .env and add your NEWS_API_KEY

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend runs at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

**3. Frontend** (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### Running with Docker

```bash
docker-compose up --build
```
Backend available at `http://localhost:8000`, frontend at `http://localhost:80`.

## Environment Variables

**Backend** (`backend/.env`)
| Variable | Description | Required |
|---|---|---|
| `NEWS_API_KEY` | API key from newsapi.org, used for live sentiment | Yes (for sentiment feature) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No (defaults to localhost) |

**Frontend** (`frontend/.env`)
| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | No (defaults to relative `/api`, used behind nginx) |

## Project Structure
```bash
alphabacktest/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine/session setup
│   ├── models/                  # ORM models and Pydantic schemas
│   ├── routes/                  # API route definitions
│   ├── services/                # Business logic (backtest engine, sentiment)
│   ├── data/                    # Bundled Nifty 50 historical datasets
│   └── utils/                   # Logging and shared utilities
├── frontend/
│   ├── src/
│   │   ├── pages/                # Route-level views
│   │   ├── components/          # Reusable UI components
│   │   ├── services/             # API client
│   │   └── App.jsx
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf
└── requirements.txt
```

## API Overview

Full interactive documentation is available at `/docs` (Swagger UI) on the running backend.

| Endpoint | Method | Description |
|---|---|---|
| `/api/backtest/run` | POST | Run a single strategy backtest |
| `/api/backtest/compare` | POST | Run and compare multiple strategies |
| `/api/backtest/strategies` | GET | List available strategies |
| `/api/backtest/history` | GET | Fetch past backtest runs |
| `/api/sentiment/live` | GET | Fetch live news sentiment for a stock |
| `/health` | GET | Health check |

## Known Limitations

- **Live sentiment does not feed into the backtest engine.** The "Live Sentiment" tab is a standalone, real-time lookup tool. The backtest strategies (including "Sentiment Only") run against a static, pre-computed sentiment column in the historical dataset — they don't currently query live news.
- **Render free-tier storage is ephemeral.** Backtest history stored in SQLite resets on redeploy or extended inactivity, since the free tier doesn't persist disk state.
- **NewsAPI free tier** has request-volume and date-range limitations; heavy usage may hit rate limits.
- **Sentiment coverage varies by stock.** Larger, more frequently covered companies return more relevant news; smaller-cap stocks may return sparse or generic results despite domain filtering.

## Acknowledgments

This project builds on earlier work from a college club initiative, independently extended and redeployed by me.

## License

This project is available for reference and educational purposes.
