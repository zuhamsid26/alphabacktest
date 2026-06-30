import { TrendingUp, Activity } from 'lucide-react'

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'backtest', label: 'Run Backtest' },
    { id: 'compare', label: 'Compare Strategies' },
    { id: 'upload', label: 'Data Manager' },
    { id: 'history', label: 'History' },
  ]
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Nifty50 Backtester</h1>
              <p className="text-xs text-gray-500">ML Strategy Engine</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </header>
  )
}
