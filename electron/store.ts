import Store from 'electron-store'

interface Settings {
  googleClientId: string
  googleClientSecret: string
  hotkey: string
  keywords: string[]
  inputMethod: 'clipboard' | 'typing' | 'ask'
  autoRefresh: boolean
  refreshInterval: number
}

interface OAuthTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
}

interface StoreSchema {
  settings: Settings
  tokens: OAuthTokens | null
}

const defaultSettings: Settings = {
  googleClientId: '',
  googleClientSecret: '',
  hotkey: 'CommandOrControl+Shift+O',
  keywords: ['verification code', 'OTP', '認証コード', '確認コード'],
  inputMethod: 'clipboard',
  autoRefresh: true,
  refreshInterval: 30,
}

export const store = new Store<StoreSchema>({
  name: 'otp-picker-config',
  defaults: {
    settings: defaultSettings,
    tokens: null,
  },
  encryptionKey: 'otp-picker-encryption-key-v1',
})

export function loadSettings(): Settings {
  return store.get('settings', defaultSettings)
}

export function saveSettings(partialSettings: Partial<Settings>): void {
  const currentSettings = loadSettings()
  const newSettings = { ...currentSettings, ...partialSettings }
  store.set('settings', newSettings)
}

export function getTokens(): OAuthTokens | null {
  return store.get('tokens', null)
}

export function saveTokens(tokens: OAuthTokens): void {
  store.set('tokens', tokens)
}

export function clearTokens(): void {
  store.delete('tokens')
}
