import { useState } from 'react'
import { Play, RotateCcw, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const STRATEGIES = [
  { id: 'momentum', label: 'Momentum Only', color: 'text-emerald-400', desc: 'Trades on Momentum_score threshold' },
  { id: 'sentiment', label: 'Sentiment Only', color: 'text-blue-400', desc: 'Trades on Sentiment_score threshold' },
  { id: 'hybrid_ml', label: 'Hybrid ML', color: 'text-amber-400', desc: 'Logistic Regression ML signal' },
]

const DEFAULT_PARAMS = {
  strategy: 'momentum',
  initial_capital: 100000,
  hold_days: 5,
  position_size_pct: 0.02,
  transaction_cost: 0.001,
  train_pct: 0.70,
  momentum_threshold: 0.5,
  sentiment_threshold: 0.1,
}

export default function StrategyPanel({ onRun, loading, onReset }) {
  const [params, setParams] = useState(DEFAULT_PARAMS)

  const set = (key, value) => setParams((p) => ({ ...p, [key]: value }))

  const handleRun = () => onRun(params)
  const handleReset = () => {
    setParams(DEFAULT_PARAMS)
    if (onReset) onReset()
  }

  const activeStrategy = STRATEGIES.find((s) => s.id === params.strategy)

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-200">Strategy Configuration</h2>
        <button onClick={handleReset} className="btn-secondary text-xs py-1.5 px-3">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Strategy selector */}
      <div>
        <label className="label">Strategy</label>
        <div className="flex flex-col gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => set('strategy', s.id)}
              className={clsx(
                'text-left px-4 py-3 rounded-lg border transition-all duration-150 text-sm',
                params.strategy === s.id
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              )}
            >
              <div className={clsx('font-medium', s.color)}>{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Capital & position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Initial Capital (₹)</label>
          <input
            type="number"
            className="input-field"
            value={params.initial_capital}
            min={1000}
            onChange={(e) => set('initial_capital', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Hold Days</label>
          <input
            type="number"
            className="input-field"
            value={params.hold_days}
            min={1}
            max={60}
            onChange={(e) => set('hold_days', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Position Size (%)</label>
          <input
            type="number"
            className="input-field"
            value={(params.position_size_pct * 100).toFixed(1)}
            min={0.1}
            max={50}
            step={0.1}
            onChange={(e) => set('position_size_pct', Number(e.target.value) / 100)}
          />
        </div>
        <div>
          <label className="label">Transaction Cost (%)</label>
          <input
            type="number"
            className="input-field"
            value={(params.transaction_cost * 100).toFixed(2)}
            min={0}
            max={5}
            step={0.01}
            onChange={(e) => set('transaction_cost', Number(e.target.value) / 100)}
          />
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Thresholds */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Momentum Threshold</label>
          <input
            type="number"
            className={clsx('input-field', params.strategy !== 'momentum' && 'opacity-40')}
            value={params.momentum_threshold}
            step={0.05}
            disabled={params.strategy !== 'momentum'}
            onChange={(e) => set('momentum_threshold', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Sentiment Threshold</label>
          <input
            type="number"
            className={clsx('input-field', params.strategy !== 'sentiment' && 'opacity-40')}
            value={params.sentiment_threshold}
            step={0.05}
            disabled={params.strategy !== 'sentiment'}
            onChange={(e) => set('sentiment_threshold', Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Train Split (%)</label>
          <input
            type="number"
            className="input-field"
            value={(params.train_pct * 100).toFixed(0)}
            min={50}
            max={90}
            onChange={(e) => {
              const pct = Math.min(90, Math.max(50, Number(e.target.value) || 50))
              set('train_pct', pct / 100)
            }}
          />
          <p className="text-xs text-gray-600 mt-1">Backtest runs on the remaining test set</p>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="btn-primary w-full justify-center py-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Running Backtest...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Backtest
          </>
        )}
      </button>
    </div>
  )
}
