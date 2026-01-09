import { useEffect, useState, useCallback } from 'react'
import { useSettingsStore, OTPEmail } from '../store/settings'

interface OTPListProps {
  onOpenSettings: () => void
  isAuthenticated: boolean
}

function OTPList({ onOpenSettings, isAuthenticated }: OTPListProps) {
  const { otpEmails, setOtpEmails, loadSettings, inputMethod, autoEnterAfterType, autoRefresh, refreshInterval } = useSettingsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError(null)
    try {
      const emails = await window.electronAPI?.fetchOTPEmails()
      if (emails) {
        setOtpEmails(emails)
      }
    } catch (err) {
      setError('メールの取得に失敗しました')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, setOtpEmails])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmails()
    }
  }, [isAuthenticated, fetchEmails])

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return

    const interval = setInterval(fetchEmails, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, autoRefresh, refreshInterval, fetchEmails])

  useEffect(() => {
    window.electronAPI?.onShowWindow(() => {
      fetchEmails()
    })
  }, [fetchEmails])

  const handleLogin = async () => {
    console.log('handleLogin called')
    setIsLoading(true)
    setError(null)
    try {
      console.log('Calling startOAuth...')
      const result = await window.electronAPI?.startOAuth()
      console.log('startOAuth result:', result)
      if (result?.success) {
        useSettingsStore.getState().setAuthenticated(true, result.email)
        fetchEmails()
      } else {
        setError(result?.error || 'ログインに失敗しました')
      }
    } catch (err) {
      setError('ログインに失敗しました')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectOTP = async (email: OTPEmail) => {
    try {
      if (inputMethod === 'clipboard') {
        await window.electronAPI?.copyToClipboard(email.code)
      } else if (inputMethod === 'typing') {
        await window.electronAPI?.typeText(email.code, { autoEnter: autoEnterAfterType })
      } else {
        // 'ask' - for now, default to clipboard
        await window.electronAPI?.copyToClipboard(email.code)
      }
    } catch (err) {
      console.error('Failed to handle OTP:', err)
    }
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const handleClose = () => {
    window.electronAPI?.hideWindow()
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 drag-region">
          <h1 className="text-lg font-semibold text-gray-900">OTP Picker</h1>
          <div className="flex items-center gap-2 no-drag">
            <button
              onClick={onOpenSettings}
              className="text-gray-500 hover:text-gray-700"
              title="設定"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              title="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Gmailにログインして、OTPコードを取得します
          </p>
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'Googleでログイン'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 drag-region">
        <h1 className="text-lg font-semibold text-gray-900">OTP Picker</h1>
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={fetchEmails}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="更新"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onOpenSettings}
            className="text-gray-500 hover:text-gray-700"
            title="設定"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            title="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {otpEmails.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              直近10分以内のOTPメールはありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {otpEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => handleSelectOTP(email)}
                className="w-full text-left p-3 bg-white/50 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 truncate">{email.from}</p>
                    <p className="text-sm text-gray-500 truncate">{email.subject}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatTime(email.receivedAt)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-mono font-bold text-blue-600">
                    {email.code}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OTPList
