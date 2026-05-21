import clsx from 'clsx'

const STRATEGY_COLORS = {
  'Momentum Only': 'text-emerald-400',
  'Sentiment Only': 'text-blue-400',
  'Hybrid ML': 'text-amber-400',
}

function Cell({ value, highlight }) {
  return (
    <td className={clsx('py-2.5 px-4 font-mono text-sm', highlight)}>
      {value}
    </td>
  )
}

export default function ComparisonTable({ data }) {
  if (!data?.length) return null

  const best = {
    'CAGR (%)': Math.max(...data.map((r) => r['CAGR (%)'])),
    Sharpe: Math.max(...data.map((r) => r.Sharpe)),
    'Win %': Math.max(...data.map((r) => r['Win %'])),
    'Final Capital': Math.max(...data.map((r) => r['Final Capital'])),
  }

  const cols = [
    { key: 'Strategy', label: 'Strategy' },
    { key: 'CAGR (%)', label: 'CAGR %', fmt: (v) => `${v?.toFixed(2)}%` },
    { key: 'Sharpe', label: 'Sharpe', fmt: (v) => v?.toFixed(3) },
    { key: 'Max DD (%)', label: 'Max DD %', fmt: (v) => `${v?.toFixed(2)}%`, worst: true },
    { key: 'Win %', label: 'Win %', fmt: (v) => `${v?.toFixed(1)}%` },
    { key: 'Trades', label: 'Trades', fmt: (v) => v?.toLocaleString() },
    { key: 'Final Capital', label: 'Final Capital', fmt: (v) => `₹${v?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
  ]

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Comparison Table</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {cols.map((c) => (
                <th key={c.key} className="text-left py-2 px-4 text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className={clsx('py-2.5 px-4 font-semibold', STRATEGY_COLORS[row.Strategy] || 'text-gray-200')}>
                  {row.Strategy}
                </td>
                {cols.slice(1).map((col) => {
                  const val = row[col.key]
                  const isBest = best[col.key] !== undefined && val === best[col.key]
                  const isWorstDD = col.worst && val === Math.min(...data.map((r) => r[col.key]))
                  return (
                    <td key={col.key} className={clsx('py-2.5 px-4 font-mono',
                      isBest && !col.worst ? 'text-emerald-400 font-bold' :
                      isWorstDD ? 'text-red-400 font-bold' : 'text-gray-300'
                    )}>
                      {col.fmt ? col.fmt(val) : val}
                      {isBest && !col.worst && <span className="ml-1 text-[9px] text-emerald-500">▲BEST</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
