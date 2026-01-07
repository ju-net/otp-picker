import { useState, useEffect } from 'react'
import { useSettingsStore } from './store/settings'
import OTPList from './components/OTPList'
import Settings from './components/Settings'
import Setup from './components/Setup'

type View = 'setup' | 'main' | 'settings'

function App() {
  const { googleClientId, isAuthenticated, loadSettings } = useSettingsStore()
  const [view, setView] = useState<View>('main')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // アプリ起動時に設定を読み込む
    const init = async () => {
      await loadSettings()
      setIsLoading(false)
    }
    init()
  }, [loadSettings])

  useEffect(() => {
    // 設定読み込み完了後、OAuth設定が未完了の場合はセットアップ画面を表示
    if (!isLoading && !googleClientId) {
      setView('setup')
    }
  }, [isLoading, googleClientId])

  const handleSetupComplete = () => {
    setView('main')
  }

  const handleOpenSettings = () => {
    setView('settings')
  }

  const handleCloseSettings = () => {
    setView('main')
  }

  if (isLoading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {view === 'setup' && (
        <Setup onComplete={handleSetupComplete} />
      )}
      {view === 'main' && (
        <OTPList
          onOpenSettings={handleOpenSettings}
          isAuthenticated={isAuthenticated}
        />
      )}
      {view === 'settings' && (
        <Settings onClose={handleCloseSettings} />
      )}
    </div>
  )
}

export default App
