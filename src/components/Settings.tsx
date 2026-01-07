import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settings'
import KeywordManager from './KeywordManager'
import type { UpdateStatus } from '../types/electron'

interface SettingsProps {
  onClose: () => void
}

function Settings({ onClose }: SettingsProps) {
  const {
    googleClientId,
    googleClientSecret,
    hotkey,
    inputMethod,
    autoRefresh,
    refreshInterval,
    isAuthenticated,
    userEmail,
    setGoogleClientId,
    setGoogleClientSecret,
    setHotkey,
    setInputMethod,
    setAutoRefresh,
    setRefreshInterval,
    setAuthenticated,
  } = useSettingsStore()

  const [localClientId, setLocalClientId] = useState(googleClientId)
  const [localClientSecret, setLocalClientSecret] = useState(googleClientSecret)
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false)
  const [localHotkey, setLocalHotkey] = useState(hotkey)
  const [hasAccessibility, setHasAccessibility] = useState(true)
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    // アクセシビリティ権限をチェック
    const checkPermission = async () => {
      const result = await window.electronAPI?.checkAccessibility()
      setHasAccessibility(result ?? true)
    }
    checkPermission()

    // アプリバージョンを取得
    const fetchVersion = async () => {
      const version = await window.electronAPI?.getAppVersion()
      if (version) setAppVersion(version)
    }
    fetchVersion()

    // アップデートステータスのリスナー
    window.electronAPI?.onUpdateStatus((status) => {
      setUpdateStatus(status)
    })
  }, [])

  const handleRequestAccessibility = async () => {
    await window.electronAPI?.requestAccessibility()
    // 少し待ってから再チェック
    setTimeout(async () => {
      const result = await window.electronAPI?.checkAccessibility()
      setHasAccessibility(result ?? true)
    }, 1000)
  }

  const handleSaveOAuth = () => {
    setGoogleClientId(localClientId)
    setGoogleClientSecret(localClientSecret)
  }

  const handleLogout = async () => {
    await window.electronAPI?.logout()
    setAuthenticated(false, null)
  }

  const handleHotkeyKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecordingHotkey) return

    e.preventDefault()

    const modifiers: string[] = []
    if (e.metaKey || e.ctrlKey) modifiers.push('CommandOrControl')
    if (e.altKey) modifiers.push('Alt')
    if (e.shiftKey) modifiers.push('Shift')

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key

    if (key === 'Control' || key === 'Meta' || key === 'Alt' || key === 'Shift') {
      return
    }

    const newHotkey = [...modifiers, key].join('+')
    setLocalHotkey(newHotkey)
    setIsRecordingHotkey(false)
  }

  const handleSaveHotkey = () => {
    setHotkey(localHotkey)
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center mb-4 drag-region flex-shrink-0">
        <button
          onClick={onClose}
          className="mr-3 text-gray-500 hover:text-gray-700 no-drag"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">設定</h1>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Google OAuth設定 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Google OAuth設定</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Client ID</label>
              <input
                type="text"
                value={localClientId}
                onChange={(e) => setLocalClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Client Secret</label>
              <input
                type="password"
                value={localClientSecret}
                onChange={(e) => setLocalClientSecret(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveOAuth}
              disabled={localClientId === googleClientId && localClientSecret === googleClientSecret}
              className="text-sm bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </section>

        {/* アカウント */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Googleアカウント</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{userEmail}</p>
                  <p className="text-xs text-green-600">ログイン中</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">未ログイン</p>
            )}
          </div>
        </section>

        {/* ホットキー */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">ホットキー</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={localHotkey}
                onKeyDown={handleHotkeyKeyDown}
                onFocus={() => setIsRecordingHotkey(true)}
                onBlur={() => setIsRecordingHotkey(false)}
                readOnly
                className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none ${
                  isRecordingHotkey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
                placeholder="クリックしてキーを入力"
              />
              <button
                onClick={handleSaveHotkey}
                disabled={localHotkey === hotkey}
                className="text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
            {isRecordingHotkey && (
              <p className="text-xs text-blue-600 mt-2">
                ホットキーを入力してください...
              </p>
            )}
          </div>
        </section>

        {/* OTPキーワード */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">OTP検索キーワード</h2>
          <KeywordManager />
        </section>

        {/* 入力方法 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">OTPコード入力方法</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="inputMethod"
                checked={inputMethod === 'clipboard'}
                onChange={() => setInputMethod('clipboard')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">クリップボードにコピー</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="inputMethod"
                checked={inputMethod === 'typing'}
                onChange={() => setInputMethod('typing')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">自動入力（タイピング）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="inputMethod"
                checked={inputMethod === 'ask'}
                onChange={() => setInputMethod('ask')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">毎回確認する</span>
            </label>

            {/* アクセシビリティ権限警告（macOS） */}
            {inputMethod === 'typing' && !hasAccessibility && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  自動入力にはアクセシビリティ権限が必要です
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  権限を付与した後、アプリを再起動してください
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestAccessibility}
                    className="text-sm bg-yellow-600 text-white py-1.5 px-3 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    権限を設定
                  </button>
                  <button
                    onClick={async () => {
                      const result = await window.electronAPI?.checkAccessibility()
                      setHasAccessibility(result ?? true)
                    }}
                    className="text-sm bg-gray-500 text-white py-1.5 px-3 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    再確認
                  </button>
                </div>
              </div>
            )}

            {inputMethod === 'typing' && hasAccessibility && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  権限が許可されています
                </p>
              </div>
            )}
          </div>
        </section>

        {/* OTPリスト自動更新 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">OTPリスト自動更新</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">自動更新を有効にする</span>
            </label>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">更新間隔:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                >
                  <option value={15}>15秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>1分</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* アプリについて */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">アプリについて</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">バージョン</span>
              <span className="text-sm text-gray-900 font-mono">{appVersion || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">アップデート</span>
              <button
                onClick={() => window.electronAPI?.checkForUpdates()}
                className="text-sm bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                更新を確認
              </button>
            </div>
            {updateStatus && (
              <div className={`p-2 rounded-lg text-sm ${
                updateStatus.status === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : updateStatus.status === 'downloading'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {updateStatus.message}
                {updateStatus.percent !== undefined && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${updateStatus.percent}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
