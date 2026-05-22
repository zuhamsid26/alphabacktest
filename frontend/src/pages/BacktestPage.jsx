import { useState } from 'react'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import StrategyPanel from '../components/StrategyPanel'
import MetricsGrid from '../components/MetricsGrid'
import EquityChart from '../components/EquityChart'
import DrawdownChart from '../components/DrawdownChart'
import TradeTable from '../components/TradeTable'
import { useBacktest } from '../hooks/useBacktest'

export default function BacktestPage() {
  const { result, loading, error, elapsed, execute, reset } = useBacktest()

  return (
    <div className="flex gap-6">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0">
        <StrategyPanel onRun={execute} loading={loading} onReset={reset} />
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Status bar */}
        {loading && (
          <div className="card px-4 py-3 flex items-center gap-3 border-blue-500/30">
            <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm text-blue-300">Running backtest engine… this may take 30–60 seconds</span>
          </div>
        )}

        {error && (
          <div className="card px-4 py-3 flex items-center gap-3 border-red-500/30 bg-red-500/5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="card px-4 py-2.5 flex items-center gap-2 border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">
                Backtest complete — {result.strategy_name}
              </span>
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> {elapsed}s
              </div>
            </div>

            <MetricsGrid metrics={result.metrics} strategyName={result.strategy_name} />
            <EquityChart equityCurve={result.equity_curve} strategyName={result.strategy_name} />
            <DrawdownChart drawdown={result.drawdown} strategyName={result.strategy_name} />
            <TradeTable trades={result.trades} />
          </>
        )}

        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Configure a strategy and hit <span className="text-emerald-400 font-medium">Run Backtest</span></p>
            <p className="text-gray-700 text-xs mt-1">Results will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
