import { useState, useRef, useEffect } from 'react'
import { Upload, File, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadFile, listFiles, deleteFile } from '../services/api'

export default function UploadManager() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const fetchFiles = async () => {
    try {
      const data = await listFiles()
      setFiles(data.files || [])
    } catch {}
  }

  useEffect(() => { fetchFiles() }, [])

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)
    setUploadResult(null)
    try {
      const result = await uploadFile(file, setProgress)
      setUploadResult(result)
      fetchFiles()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (filename) => {
    try {
      await deleteFile(filename)
      fetchFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-200 mb-1">Data Manager</h2>
        <p className="text-xs text-gray-500 mb-5">
          Upload custom datasets (.csv, .xls, .xlsx). Uploaded files will be available in the backtest configuration.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
            ${dragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/30'}`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? 'text-emerald-400' : 'text-gray-600'}`} />
          <p className="text-sm text-gray-400">Drop your file here, or <span className="text-emerald-400 font-medium">browse</span></p>
          <p className="text-xs text-gray-600 mt-1">Supports .csv, .xls, .xlsx — max 100 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </div>

        {/* Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {uploadResult && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-emerald-300 font-semibold">{uploadResult.filename}</p>
              <p className="text-gray-400 mt-0.5">{uploadResult.rows.toLocaleString()} rows · Columns: {uploadResult.columns.slice(0, 5).join(', ')}{uploadResult.columns.length > 5 ? '…' : ''}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* File list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Uploaded Files</h3>
          <button onClick={fetchFiles} className="btn-secondary py-1.5 px-3 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {files.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">No files uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.filename}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <File className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{f.filename}</p>
                    <p className="text-xs text-gray-500">{f.size_kb} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(f.filename)}
                  className="p-1.5 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Default Datasets (Built-in)</h3>
        <div className="space-y-2">
          {['fused_dataset.csv', 'Nifty50_Master_Cleaned_Full.csv', 'sentiment_daily.csv', 'momentum_features.csv', 'clean_price_master.csv'].map((name) => (
            <div key={name} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-800/30 border border-gray-800">
              <File className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-gray-400 font-mono">{name}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">built-in</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
