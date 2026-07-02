import { useState } from 'react'
import { getLiveSentiment } from '../services/api'
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react'

const NIFTY50_STOCKS = [
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','HINDUNILVR','ITC',
  'SBIN','BHARTIARTL','KOTAKBANK','LT','AXISBANK','ASIANPAINT','MARUTI',
  'SUNPHARMA','TITAN','BAJFINANCE','WIPRO','ULTRACEMCO','HCLTECH',
  'NESTLEIND','TECHM','POWERGRID','NTPC','ONGC','JSWSTEEL','TATASTEEL',
  'ADANIENT','ADANIPORTS','BAJAJFINSV','BPCL','BRITANNIA','CIPLA',
  'COALINDIA','DIVISLAB','DRREDDY','EICHERMOT','GRASIM','HDFCLIFE',
  'HEROMOTOCO','HINDALCO','INDUSINDBK','LTIM','MM','SBILIFE',
  'SHRIRAMFIN','TATACONSUM','TATAMOTORS','TRENT','VEDL'
]

const SentimentBadge = ({ label }) => {
  if (label === 'positive') {
    return (
      <span className='flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'>
        <TrendingUp className='w-3.5 h-3.5' /> Positive
      </span>
    )
  }
  if (label === 'negative') {
    return (
      <span className='flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30'>
        <TrendingDown className='w-3.5 h-3.5' /> Negative
      </span>
    )
  }
  return (
    <span className='flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30'>
      <Minus className='w-3.5 h-3.5' /> Neutral
    </span>
  )
}

export default function SentimentPage() {
  const [stockInput, setStockInput] = useState('RELIANCE')
  const [daysBack, setDaysBack] = useState(3)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const handleInputChange = (val) => {
    const upper = val.toUpperCase()
    setStockInput(upper)
    if (upper.length > 0) {
      setSuggestions(NIFTY50_STOCKS.filter(s => s.startsWith(upper)).slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const selectSuggestion = (s) => {
    setStockInput(s)
    setSuggestions([])
  }

  const fetchSentiment = async () => {
    if (!stockInput.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSuggestions([])
    try {
      const data = await getLiveSentiment(stockInput.trim(), daysBack)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='bg-gray-900 border border-gray-800 rounded-xl p-6'>
        <h2 className='text-lg font-semibold text-white mb-1'>Live Market Sentiment</h2>
        <p className='text-sm text-gray-500 mb-6'>
          Fetches recent financial news and scores sentiment using VADER. Sources restricted to Indian financial news domains. Supports all Nifty 50 stocks.
        </p>
        <div className='flex flex-wrap gap-4 items-end'>
          <div className='relative'>
            <label className='block text-xs text-gray-400 mb-1.5'>Stock Symbol</label>
            <input
              type='text'
              value={stockInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSentiment()}
              placeholder='e.g. RELIANCE, TCS, INFY'
              className='bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 w-52 focus:outline-none focus:border-emerald-500'
            />
            {suggestions.length > 0 && (
              <div className='absolute top-full left-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-10'>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => selectSuggestion(s)}
                    className='w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition'
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>Days of News</label>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className='bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'
            >
              {[1, 2, 3, 5, 7].map(d => (
                <option key={d} value={d}>Last {d} day{d > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchSentiment}
            disabled={loading || !stockInput.trim()}
            className='flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium text-sm rounded-lg transition'
          >
            <RefreshCw className={'w-4 h-4' + (loading ? ' animate-spin' : '')} />
            {loading ? 'Fetching...' : 'Refresh Sentiment'}
          </button>
        </div>
      </div>

      {error && (
        <div className='flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400'>
          <AlertCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
          <div>
            <p className='font-medium text-sm'>Failed to fetch sentiment</p>
            <p className='text-xs mt-0.5 opacity-80'>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className='space-y-4'>
          <div className='bg-gray-900 border border-gray-800 rounded-xl p-6'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div>
                <p className='text-xs text-gray-500 mb-1'>Stock</p>
                <p className='text-2xl font-bold text-white'>{result.stock}</p>
                <p className='text-xs text-gray-600 mt-0.5'>Searched as: {result.query_used}</p>
              </div>
              <div className='text-center'>
                <p className='text-xs text-gray-500 mb-1'>Overall Sentiment</p>
                <SentimentBadge label={result.sentiment_label} />
              </div>
              <div className='text-center'>
                <p className='text-xs text-gray-500 mb-1'>Avg Score</p>
                <p
                  className={
                    'text-2xl font-bold ' +
                    (result.average_sentiment >= 0.05
                      ? 'text-emerald-400'
                      : result.average_sentiment <= -0.05
                      ? 'text-red-400'
                      : 'text-gray-400')
                  }
                >
                  {(result.average_sentiment ?? 0).toFixed(4)}
                </p>
              </div>
              <div className='text-center'>
                <p className='text-xs text-gray-500 mb-1'>Articles Analysed</p>
                <p className='text-2xl font-bold text-white'>{result.article_count}</p>
              </div>
            </div>
          </div>

          {result.article_count === 0 ? (
            <div className='bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500'>
              <p>No relevant financial news found for {result.stock}.</p>
              <p className='text-sm mt-1'>Try increasing the days range or a different stock symbol.</p>
            </div>
          ) : (
            <div className='bg-gray-900 border border-gray-800 rounded-xl overflow-hidden'>
              <div className='px-5 py-3 border-b border-gray-800'>
                <h3 className='text-sm font-medium text-white'>News Articles</h3>
              </div>
              <div className='divide-y divide-gray-800'>
                {result.articles.map((article, idx) => (
                  <div key={idx} className='px-5 py-4 hover:bg-gray-800/30 transition'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <a
                          href={article.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-gray-200 hover:text-emerald-400 transition line-clamp-2'
                        >
                          {article.title}
                        </a>
                        <div className='flex items-center gap-3 mt-1.5'>
                          <span className='text-xs text-gray-500'>{article.source}</span>
                          <span className='text-xs text-gray-600'>
                            {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={
                          'text-sm font-medium flex-shrink-0 ' +
                          (article.sentiment_score >= 0.05
                            ? 'text-emerald-400'
                            : article.sentiment_score <= -0.05
                            ? 'text-red-400'
                            : 'text-gray-400')
                        }
                      >
                        {article.sentiment_score > 0 ? '+' : ''}
                        {(article.sentiment_score ?? 0).toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className='text-xs text-gray-600 px-1'>
            Note: Sentiment sourced from financial news domains (Economic Times, Moneycontrol, Business Standard etc.). VADER scores range from -1 (most negative) to +1 (most positive). Articles may include broader market context.
          </p>
        </div>
      )}
    </div>
  )
}
