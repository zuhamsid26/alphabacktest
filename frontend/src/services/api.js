import axios from 'axios'

// âœ… Always use nginx route
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// Error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

// ---------------- API CALLS ----------------

// Backtest
export const runBacktest = (params) =>
  api.post('/backtest/run', params).then((r) => r.data)

// Compare
export const compareStrategies = (params) =>
  api.post('/backtest/compare', params).then((r) => r.data)

// Strategies list
export const listStrategies = () =>
  api.get('/backtest/strategies').then((r) => r.data)

// Upload file
export const uploadFile = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)

  return api
    .post('/data/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
    })
    .then((r) => r.data)
}

// List files
export const listFiles = () =>
  api.get('/data/files').then((r) => r.data)

// Delete file
export const deleteFile = (filename) =>
  api.delete(`/data/files/${filename}`).then((r) => r.data)

// Health check
export const healthCheck = () =>
  api
    .get('/health')
    .then((r) => r.data)
    .catch(() => ({ status: 'offline' }))

// History
export const getHistory = (limit = 20) =>
  api.get(`/backtest/history?limit=${limit}`).then((r) => r.data)
// Live Sentiment
export const getLiveSentiment = (stock, daysBack = 3) =>
  api.get(`/sentiment/live?stock=${stock}&days_back=${daysBack}`).then((r) => r.data)
