import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react'
import clsx from 'clsx'

const PAGE_SIZE = 15

export default function TradeTable({ trades }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('entry_date')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    if (!trades?.length) return []
    return trades.filter((t) =>
      !search || t.stock?.toLowerCase().includes(search.toLowerCase())
    )
  }, [trades, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  const downloadCSV = () => {
    if (!trades?.length) return
    const headers = Object.keys(trades[0]).join(',')
    const rows = trades.map((t) => Object.values(t).join(',')).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trade_log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-gray-600" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-emerald-400" />
      : <ChevronDown className="w-3 h-3 text-emerald-400" />
  }

  const cols = [
    { key: 'entry_date', label: 'Entry Date' },
    { key: 'exit_date', label: 'Exit Date' },
    { key: 'stock', label: 'Stock' },
    { key: 'entry_price', label: 'Entry ₹' },
    { key: 'exit_price', label: 'Exit ₹' },
    { key: 'shares', label: 'Shares' },
    { key: 'pnl', label: 'PnL ₹' },
    { key: 'return_pct', label: 'Return %' },
    { key: 'win', label: 'Result' },
  ]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Trade Log</h3>
          <p className="text-xs text-gray-500">{filtered.length.toLocaleString()} trades</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="input-field pl-8 w-40 py-1.5 text-xs"
              placeholder="Filter by stock..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <button onClick={downloadCSV} className="btn-secondary text-xs py-1.5 px-3">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left py-2 px-3 text-gray-500 font-medium uppercase tracking-wider cursor-pointer hover:text-gray-300 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {col.label} <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((trade, idx) => (
              <tr
                key={idx}
                className={clsx(
                  'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors',
                  trade.win === 1 ? 'text-gray-200' : 'text-gray-400'
                )}
              >
                <td className="py-2 px-3 font-mono">{trade.entry_date}</td>
                <td className="py-2 px-3 font-mono">{trade.exit_date}</td>
                <td className="py-2 px-3 font-semibold text-blue-400">{trade.stock}</td>
                <td className="py-2 px-3 font-mono">{trade.entry_price?.toFixed(2)}</td>
                <td className="py-2 px-3 font-mono">{trade.exit_price?.toFixed(2)}</td>
                <td className="py-2 px-3 font-mono">{trade.shares?.toFixed(3)}</td>
                <td className={clsx('py-2 px-3 font-mono font-semibold', trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}
                </td>
                <td className={clsx('py-2 px-3 font-mono', trade.return_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {trade.return_pct >= 0 ? '+' : ''}{trade.return_pct?.toFixed(3)}%
                </td>
                <td className="py-2 px-3">
                  <span className={clsx('px-2 py-0.5 rounded text-[10px] font-semibold',
                    trade.win === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {trade.win === 1 ? 'WIN' : 'LOSS'}
                  </span>
                </td>
              </tr>
            ))}
            {!paginated.length && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-600">No trades found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
