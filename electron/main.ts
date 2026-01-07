import { app, BrowserWindow, ipcMain, clipboard, screen, systemPreferences, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { setupTray } from './tray'
import { initAutoUpdater, checkForUpdates, getAppVersion } from './updater'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { setupHotkey, updateHotkey } from './hotkey'
import { store, loadSettings, saveSettings } from './store'
import { startOAuth, logout, checkAuthStatus, getOAuthClient } from './gmail/auth'
import { fetchOTPEmails } from './gmail/api'

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    minWidth: 300,
    minHeight: 300,
    show: false,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    visibleOnAllWorkspaces: true,
    fullscreenable: false,
    transparent: true,
    hasShadow: true,
    type: process.platform === 'darwin' ? 'panel' : 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // プラットフォーム別の設定
  if (process.platform === 'darwin') {
    // macOS: フルスクリーンアプリの上にも表示
    mainWindow.setAlwaysOnTop(true, 'pop-up-menu', 1)
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    app.dock.hide()
  } else if (process.platform === 'win32') {
    // Windows: 常に最前面
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
  }

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  return mainWindow
}

function showWindow() {
  if (mainWindow) {
    // カーソルのある画面の中央に配置
    const cursorPoint = screen.getCursorScreenPoint()
    const activeDisplay = screen.getDisplayNearestPoint(cursorPoint)
    const { width: screenWidth, height: screenHeight } = activeDisplay.workAreaSize
    const { x: screenX, y: screenY } = activeDisplay.workArea
    const [windowWidth, windowHeight] = mainWindow.getSize()

    const x = Math.round(screenX + (screenWidth - windowWidth) / 2)
    const y = Math.round(screenY + (screenHeight - windowHeight) / 3) // 少し上寄りに配置

    mainWindow.setPosition(x, y)

    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('show-window')
  }
}

app.whenReady().then(() => {
  const win = createWindow()
  setupTray(showWindow, () => app.quit())

  // Initialize auto-updater
  initAutoUpdater(win)
  // Check for updates after a short delay
  setTimeout(() => {
    checkForUpdates()
  }, 3000)

  const settings = loadSettings()
  setupHotkey(settings.hotkey, showWindow)

  // IPC handlers
  ipcMain.handle('load-settings', () => loadSettings())
  ipcMain.handle('save-settings', (_, settings) => saveSettings(settings))

  ipcMain.handle('update-hotkey', (_, hotkey: string) => {
    updateHotkey(hotkey, showWindow)
    return true
  })

  ipcMain.handle('start-oauth', async () => {
    const settings = loadSettings()
    console.log('start-oauth called, settings:', JSON.stringify(settings, null, 2))
    if (!settings.googleClientId) {
      console.log('No googleClientId found')
      return { success: false, error: 'Client IDが設定されていません' }
    }
    if (!settings.googleClientSecret) {
      console.log('No googleClientSecret found')
      return { success: false, error: 'Client Secretが設定されていません' }
    }
    console.log('Calling startOAuth with clientId:', settings.googleClientId)
    return startOAuth(settings.googleClientId, settings.googleClientSecret)
  })

  ipcMain.handle('logout', () => logout())
  ipcMain.handle('check-auth-status', () => {
    const settings = loadSettings()
    return checkAuthStatus(settings.googleClientId, settings.googleClientSecret)
  })

  ipcMain.handle('fetch-otp-emails', async () => {
    const settings = loadSettings()
    const oauth2Client = getOAuthClient()
    if (!oauth2Client) {
      return []
    }
    return fetchOTPEmails(oauth2Client, settings.keywords)
  })

  ipcMain.handle('copy-to-clipboard', (_, text: string) => {
    clipboard.writeText(text)
    mainWindow?.hide()
  })

  ipcMain.handle('hide-window', () => {
    mainWindow?.hide()
  })

  // アクセシビリティ権限チェック
  ipcMain.handle('check-accessibility', () => {
    if (process.platform === 'darwin') {
      return systemPreferences.isTrustedAccessibilityClient(false)
    }
    // Windows/Linuxでは常にtrue
    return true
  })

  // アップデート関連
  ipcMain.handle('check-for-updates', () => {
    checkForUpdates()
  })

  ipcMain.handle('get-app-version', () => {
    return getAppVersion()
  })

  // アクセシビリティ設定を開く
  ipcMain.handle('request-accessibility', () => {
    if (process.platform === 'darwin') {
      // 権限ダイアログを表示（プロンプト付き）
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(true)
      if (!isTrusted) {
        // システム環境設定を開く
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility')
      }
      return isTrusted
    }
    return true
  })

  ipcMain.handle('type-text', async (_, text: string) => {
    // Hide window first to focus on the previous app
    mainWindow?.hide()

    // Small delay to let the previous window focus
    await new Promise(resolve => setTimeout(resolve, 200))

    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    try {
      if (process.platform === 'darwin') {
        // macOS: AppleScript
        const escaped = text
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
        await execAsync(`osascript -e 'tell application "System Events" to keystroke "${escaped}"'`)
      } else if (process.platform === 'win32') {
        // Windows: PowerShell + SendKeys
        const escaped = text
          .replace(/'/g, "''")
          .replace(/`/g, '``')
        await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escaped}')"`)
      } else {
        // Linux: xdotool (if available)
        const escaped = text.replace(/'/g, "'\\''")
        await execAsync(`xdotool type '${escaped}'`)
      }
    } catch (error) {
      console.error('Failed to type text:', error)
      // フォールバック：クリップボードにコピー
      clipboard.writeText(text)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      showWindow()
    }
  })
})

app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Extend app type
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}
