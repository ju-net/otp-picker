const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script loaded!')

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Hotkey
  updateHotkey: (hotkey) => ipcRenderer.invoke('update-hotkey', hotkey),

  // OAuth
  startOAuth: () => ipcRenderer.invoke('start-oauth'),
  logout: () => ipcRenderer.invoke('logout'),
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),

  // Gmail
  fetchOTPEmails: () => ipcRenderer.invoke('fetch-otp-emails'),

  // Input
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  typeText: (text, options) => ipcRenderer.invoke('type-text', text, options),

  // Window
  hideWindow: () => ipcRenderer.invoke('hide-window'),

  // Accessibility
  checkAccessibility: () => ipcRenderer.invoke('check-accessibility'),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_, status) => callback(status))
  },

  // Events
  onShowWindow: (callback) => {
    ipcRenderer.on('show-window', callback)
  },
  onOTPSelected: (callback) => {
    ipcRenderer.on('otp-selected', (_, code) => callback(code))
  }
})
