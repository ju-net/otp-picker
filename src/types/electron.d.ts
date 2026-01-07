import type { Settings, OTPEmail } from '../store/settings'

export interface AuthStatus {
  authenticated: boolean
  email: string | null
}

export interface UpdateStatus {
  status: 'downloading' | 'error' | 'ready'
  message?: string
  percent?: number
}

export interface ElectronAPI {
  // Settings
  loadSettings: () => Promise<Settings | null>
  saveSettings: (settings: Partial<Settings>) => Promise<void>

  // Hotkey
  updateHotkey: (hotkey: string) => Promise<void>

  // OAuth
  startOAuth: () => Promise<{ success: boolean; email?: string; error?: string }>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<AuthStatus>

  // Gmail
  fetchOTPEmails: () => Promise<OTPEmail[]>

  // Input
  copyToClipboard: (text: string) => Promise<void>
  typeText: (text: string) => Promise<void>

  // Window
  hideWindow: () => Promise<void>

  // Accessibility
  checkAccessibility: () => Promise<boolean>
  requestAccessibility: () => Promise<boolean>

  // Updates
  checkForUpdates: () => Promise<void>
  getAppVersion: () => Promise<string>
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => void

  // Events
  onShowWindow: (callback: () => void) => void
  onOTPSelected: (callback: (code: string) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
