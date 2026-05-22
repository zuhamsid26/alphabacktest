import { useState } from 'react'
import Navbar from './components/Navbar'
import BacktestPage from './pages/BacktestPage'
import ComparePage from './pages/ComparePage'
import UploadPage from './pages/UploadPage'

export default function App() {
  const [activeTab, setActiveTab] = useState('backtest')

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'backtest' && <BacktestPage />}
        {activeTab === 'compare' && <ComparePage />}
        {activeTab === 'upload' && <UploadPage />}
      </main>
    </div>
  )
}
