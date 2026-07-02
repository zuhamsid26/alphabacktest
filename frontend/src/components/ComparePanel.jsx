import { useState } from 'react'
import { Play, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

const STRATEGIES = [
  { id: 'momentum', label: 'Momentum Only', color: 'emerald' },
  { id: 'sentiment', label: 'Sentiment Only', color: 'blue' },
  { id: 'hybrid_ml', label: 'Hybrid ML', color: 'amber' },
]

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', dot: 'bg-blue-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-400' },
}

const DEFAULT_PARAMS = {
  initial_capital: 100000,
  hold_days: 5,
  position_size_pct: 0.02,
  transaction_cost: 0.001,
  train_pct: 0.70,
  momentum_threshold: 0.5,
  sentiment_threshold: 0.1,
}

export default function ComparePanel({ onCompare, loading }) {
  const [selected, setSelected] = useState(['momentum', 'sentiment', 'hybrid_ml'])
  const [params, setParams] = useState(DEFAULT_PARAMS)

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )

  const set = (key, val) => setParams((p) => ({ ...p, [key]: val }))

  const handleRun = () => {
    if (selected.length === 0) return
    onCompare({ strategies: selected, ...params })
  }

  return (
    <div className="card p-5 flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        Compare Strategies
      </h2>

      <div>
        <label className="label">Select Strategies to Compare</label>
        <div className="flex flex-col gap-2">
          {STRATEGIES.map((s) => {
            const active = selected.includes(s.id)
            const c = COLOR_MAP[s.color]
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-150 text-sm',
                  active ? `${c.bg} ${c.border}` : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                )}
              >
                <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', active ? c.dot : 'bg-gray-600')} />
                <span className={active ? c.text : 'text-gray-400'}>{s.label}</span>
              </button>
            )
          })}
        </div>
        {selected.length === 0 && (
          <p className="text-xs text-red-400 mt-2">Select at least one strategy</p>
        )}
      </div>

      <hr className="border-gray-800" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Initial Capital (₹)</label>
          <input type="number" className="input-field" value={params.initial_capital}
            min={1000} onChange={(e) => set('initial_capital', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Hold Days</label>
          <input type="number" className="input-field" value={params.hold_days}
            min={1} max={60} onChange={(e) => set('hold_days', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Position Size (%)</label>
          <input type="number" className="input-field"
            value={(params.position_size_pct * 100).toFixed(1)} min={0.1} max={50} step={0.1}
            onChange={(e) => set('position_size_pct', Number(e.target.value) / 100)} />
        </div>
        <div>
          <label className="label">Train Split (%)</label>
          <input type="number" className="input-field"
            value={(params.train_pct * 100).toFixed(0)} min={50} max={90}
            onChange={(e) => {
              const pct = Math.min(90, Math.max(50, Number(e.target.value) || 50))
              set('train_pct', pct / 100)
            }} />
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading || selected.length === 0}
        className="btn-primary w-full justify-center py-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Comparing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Comparison
          </>
        )}
      </button>
    </div>
  )
}
