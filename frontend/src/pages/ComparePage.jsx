import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import ComparePanel from '../components/ComparePanel'
import EquityChart from '../components/EquityChart'
import ComparisonTable from '../components/ComparisonTable'
import { useBacktest } from '../hooks/useBacktest'

export default function ComparePage() {
  const { compareResult, loading, error, elapsed, compare } = useBacktest()

  return (
    <div className="flex gap-6">
      <div className="w-72 flex-shrink-0">
        <ComparePanel onCompare={compare} loading={loading} />
      </div>

      <div className="flex-1 min-w-0 space-y-5">
        {loading && (
          <div className="card px-4 py-3 flex items-center gap-3 border-blue-500/30">
            <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm text-blue-300">Running all strategies… this may take 60–120 seconds</span>
          </div>
        )}

        {error && (
          <div className="card px-4 py-3 flex items-center gap-3 border-red-500/30 bg-red-500/5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {compareResult && !loading && (
          <>
            <div className="card px-4 py-2.5 flex items-center gap-2 border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                Comparison complete — {Object.keys(compareResult.results).length} strategies
              </span>
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> {elapsed}s
              </div>
            </div>

            <EquityChart compareData={compareResult.results} />
            <ComparisonTable data={compareResult.comparison_table} />
          </>
        )}

        {!compareResult && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Select strategies and hit <span className="text-emerald-400 font-medium">Run Comparison</span></p>
            <p className="text-gray-700 text-xs mt-1">All equity curves will be overlaid on one chart</p>
          </div>
        )}
      </div>
    </div>
  )
}
