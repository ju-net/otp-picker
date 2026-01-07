import { useState } from 'react'
import { useSettingsStore } from '../store/settings'

interface SetupProps {
  onComplete: () => void
}

function Setup({ onComplete }: SetupProps) {
  const { setGoogleClientId, setGoogleClientSecret } = useSettingsStore()
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!clientId.trim()) {
      setError('Client IDを入力してください')
      return
    }

    if (!clientSecret.trim()) {
      setError('Client Secretを入力してください')
      return
    }

    setGoogleClientId(clientId.trim())
    setGoogleClientSecret(clientSecret.trim())
    onComplete()
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="drag-region h-4 flex-shrink-0"></div>
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
      <div className="max-w-md w-full p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">OTP Picker</h1>
        <p className="text-gray-600 mb-6">
          GmailからOTPコードを取得するには、Google Cloud ConsoleでOAuth Client IDを作成し、以下に入力してください。
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">セットアップ手順</h3>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>Google Cloud Consoleでプロジェクトを作成</li>
            <li>Gmail APIを有効化</li>
            <li>OAuth同意画面を設定</li>
            <li>OAuth 2.0クライアントIDを作成（デスクトップアプリ）</li>
            <li>Client IDとClient Secretをコピー</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </div>

          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <input
              type="password"
              id="clientSecret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="GOCSPX-xxxx"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            設定を保存
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}

export default Setup
