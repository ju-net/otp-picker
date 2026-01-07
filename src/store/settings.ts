import { create } from 'zustand'

export interface OTPEmail {
  id: string
  subject: string
  from: string
  code: string
  receivedAt: Date
}

export interface Settings {
  googleClientId: string
  googleClientSecret: string
  hotkey: string
  keywords: string[]
  inputMethod: 'clipboard' | 'typing' | 'ask'
  autoRefresh: boolean
  refreshInterval: number
}

interface SettingsState extends Settings {
  isAuthenticated: boolean
  userEmail: string | null
  otpEmails: OTPEmail[]
  setGoogleClientId: (clientId: string) => void
  setGoogleClientSecret: (clientSecret: string) => void
  setHotkey: (hotkey: string) => void
  setKeywords: (keywords: string[]) => void
  addKeyword: (keyword: string) => void
  removeKeyword: (keyword: string) => void
  setInputMethod: (method: 'clipboard' | 'typing' | 'ask') => void
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (seconds: number) => void
  setAuthenticated: (authenticated: boolean, email?: string | null) => void
  setOtpEmails: (emails: OTPEmail[]) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default values
  googleClientId: '',
  googleClientSecret: '',
  hotkey: 'CommandOrControl+Shift+O',
  keywords: ['verification code', 'OTP', '認証コード', '確認コード'],
  inputMethod: 'clipboard',
  autoRefresh: true,
  refreshInterval: 30,
  isAuthenticated: false,
  userEmail: null,
  otpEmails: [],

  setGoogleClientId: (clientId) => {
    set({ googleClientId: clientId })
    get().saveSettings()
  },

  setGoogleClientSecret: (clientSecret) => {
    set({ googleClientSecret: clientSecret })
    get().saveSettings()
  },

  setHotkey: (hotkey) => {
    set({ hotkey })
    get().saveSettings()
    // メインプロセスにホットキー変更を通知
    window.electronAPI?.updateHotkey(hotkey)
  },

  setKeywords: (keywords) => {
    set({ keywords })
    get().saveSettings()
  },

  addKeyword: (keyword) => {
    const { keywords } = get()
    if (!keywords.includes(keyword)) {
      set({ keywords: [...keywords, keyword] })
      get().saveSettings()
    }
  },

  removeKeyword: (keyword) => {
    const { keywords } = get()
    set({ keywords: keywords.filter(k => k !== keyword) })
    get().saveSettings()
  },

  setInputMethod: (inputMethod) => {
    set({ inputMethod })
    get().saveSettings()
  },

  setAutoRefresh: (autoRefresh) => {
    set({ autoRefresh })
    get().saveSettings()
  },

  setRefreshInterval: (refreshInterval) => {
    set({ refreshInterval })
    get().saveSettings()
  },

  setAuthenticated: (isAuthenticated, userEmail = null) => {
    set({ isAuthenticated, userEmail })
  },

  setOtpEmails: (otpEmails) => {
    set({ otpEmails })
  },

  loadSettings: async () => {
    const settings = await window.electronAPI?.loadSettings()
    if (settings) {
      set({
        googleClientId: settings.googleClientId || '',
        googleClientSecret: settings.googleClientSecret || '',
        hotkey: settings.hotkey || 'CommandOrControl+Shift+O',
        keywords: settings.keywords || ['verification code', 'OTP', '認証コード', '確認コード'],
        inputMethod: settings.inputMethod || 'clipboard',
        autoRefresh: settings.autoRefresh ?? true,
        refreshInterval: settings.refreshInterval || 30,
      })
    }

    // 認証状態をチェック
    const authStatus = await window.electronAPI?.checkAuthStatus()
    if (authStatus) {
      set({ isAuthenticated: authStatus.authenticated, userEmail: authStatus.email })
    }
  },

  saveSettings: async () => {
    const { googleClientId, googleClientSecret, hotkey, keywords, inputMethod, autoRefresh, refreshInterval } = get()
    await window.electronAPI?.saveSettings({
      googleClientId,
      googleClientSecret,
      hotkey,
      keywords,
      inputMethod,
      autoRefresh,
      refreshInterval,
    })
  },
}))
